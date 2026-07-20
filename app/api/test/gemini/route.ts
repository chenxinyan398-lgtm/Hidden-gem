import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const testCaption = "超隱密的私房景點！位於台北市大安區新生南路三段94號，這家『隱藏寶石咖啡』的抹茶布丁超級好吃！營業時間下午兩點到八點。";
    const testImageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop";

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // 使用最新一代的 gemini-3.5-flash 模型
    const { object } = await generateObject({
      model: google('gemini-3.5-flash'),
      schema: z.object({
        title: z.string().describe('店名或景點名稱'),
        address: z.string().describe('地址'),
        recommendations: z.array(z.string()).describe('推薦的美食或特色'),
        description: z.string().describe('根據貼文內容生成一段大約 30 字的簡短生動描述'),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `這是一則 Instagram 貼文，請從圖片與文字中擷取資訊：\n\n貼文文字：${testCaption}`,
            },
            {
              type: 'image',
              image: testImageUrl,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: object,
      source: {
        caption: testCaption,
        image: testImageUrl
      }
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during Gemini API call" },
      { status: 500 }
    );
  }
}
