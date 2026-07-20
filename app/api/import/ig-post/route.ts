import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 允許最多 60 秒處理時間

function extractShortcode(url: string): string {
  const matches = [...url.matchAll(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/g)];
  if (matches.length > 0) {
    return matches[matches.length - 1][1];
  }
  return url.trim().replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "請提供 IG 貼文網址" }, { status: 400 });
    }

    const shortcode = extractShortcode(url);
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const rapidApiHost = process.env.RAPIDAPI_HOST || 'instagram-scraper-stable-api.p.rapidapi.com';
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!rapidApiKey) {
      return NextResponse.json({ error: "未設定 RAPIDAPI_KEY" }, { status: 500 });
    }
    if (!geminiApiKey) {
      return NextResponse.json({ error: "未設定 GEMINI_API_KEY" }, { status: 500 });
    }

    // 1. 呼叫 RapidAPI 抓取 IG 貼文
    const apiUrl = `https://${rapidApiHost}/get_media_data_v2.php?media_code=${encodeURIComponent(shortcode)}`;
    const igRes = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': rapidApiKey,
        'x-rapidapi-host': rapidApiHost,
        'content-type': 'application/json'
      }
    });

    if (!igRes.ok) {
      const errData = await igRes.json().catch(() => ({}));
      return NextResponse.json({ error: "無法存取 IG 貼文內容", details: errData }, { status: igRes.status });
    }

    const igData = await igRes.json();

    // 擷取 Caption 與 圖片網址
    const caption = igData.edge_media_to_caption?.edges?.[0]?.node?.text || '';
    const rawImages: string[] = [];

    if (igData.edge_sidecar_to_children?.edges?.length > 0) {
      igData.edge_sidecar_to_children.edges.forEach((edge: any) => {
        if (edge.node?.display_url) {
          rawImages.push(edge.node.display_url);
        }
      });
    } else if (igData.display_url) {
      rawImages.push(igData.display_url);
    } else if (igData.thumbnail_src) {
      rawImages.push(igData.thumbnail_src);
    }

    // 地點參考資訊
    const locationName = igData.location?.name || '';
    let locationStreet = '';
    if (igData.location?.address_json) {
      try {
        const addrObj = JSON.parse(igData.location.address_json);
        locationStreet = addrObj.street_address || '';
      } catch (e) {}
    }

    // 限制傳給 AI 的圖片最多為前 4 張
    const targetImages = rawImages.slice(0, 4);

    // 2. 轉存圖片到 Supabase Storage (避免 IG CDN 網址過期)
    const uploadedPhotos: string[] = [];
    const supabase = await createClient();

    for (let i = 0; i < targetImages.length; i++) {
      try {
        const imgRes = await fetch(targetImages[i]);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = `ig_import/${shortcode}_${i}_${Date.now()}.jpg`;

          const { error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (!uploadErr) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);
            uploadedPhotos.push(publicUrl);
          } else {
            console.error('Supabase upload error:', uploadErr);
            uploadedPhotos.push(targetImages[i]); // Fallback
          }
        } else {
          uploadedPhotos.push(targetImages[i]); // Fallback
        }
      } catch (err) {
        console.error('Failed to upload image to Supabase:', err);
        uploadedPhotos.push(targetImages[i]); // Fallback
      }
    }

    // 3. 呼叫 Gemini 3.5 Flash 進行視覺 + 文字分析
    const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

    const messageContent: any[] = [
      {
        type: 'text',
        text: `你是一位旅行與美食圖鑑專家。請根據這篇 Instagram 貼文的文字與圖片，萃取出結構化資料，用於填寫筆記。
        
【參考資訊】
- 貼文內文：${caption}
- 標記地點名稱：${locationName}
- 標記街道地址：${locationStreet}
`
      }
    ];

    // 將圖片加入 AI Prompt
    targetImages.forEach((imgUrl) => {
      messageContent.push({
        type: 'image',
        image: imgUrl
      });
    });

    const { object } = await generateObject({
      model: google('gemini-3.5-flash'),
      schema: z.object({
        title: z.string().describe('餐廳、店名或景點名稱'),
        type: z.enum(['spot', 'dish']).describe('筆記主題分類：美食/餐廳/小吃/甜點選 dish，打卡景點/風景/古蹟選 spot'),
        address: z.string().describe('完整地址（包含縣市、鄉鎮市區、路段號）。若內文有寫則優先使用內文地址，次要使用標記地點。'),
        recommendation: z.string().describe('一句話私房建議或真心推薦理由 (約 15-30 字)'),
        content: z.string().describe('詳細介紹、環境氣氛或交通時間備註 (約 50-100 字)'),
        recommended_dishes: z.string().optional().describe('若類型為 dish，招牌或推薦餐點名稱列表 (例如：海膽飯、黑松露燉飯)，多項請用頓號或逗號分隔'),
        price_range: z.string().optional().describe('若類型為 dish，大概價格區間或人均價位 (例如：NT$ 200 - 500 / 人)'),
        dining_review: z.string().optional().describe('若類型為 dish，餐後口感與心得詳細評價')
      }),
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        ...object,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : targetImages
      }
    });

  } catch (error: any) {
    console.error("IG Post Import Error:", error);
    return NextResponse.json(
      { error: error.message || "自動解析 IG 貼文失敗，請稍後再試" },
      { status: 500 }
    );
  }
}
