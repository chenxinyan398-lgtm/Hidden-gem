import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 健全的 Shortcode 擷取函式 (可處理各種 IG 網址格式、多重重複貼上等問題)
function extractShortcode(url: string): string {
  // 匹配 p/、reel/ 或 tv/ 後面的英文數字底線代碼
  const matches = [...url.matchAll(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/g)];
  if (matches.length > 0) {
    // 取得最後一個匹配到的 ID (避免前端重複貼上兩次網址)
    return matches[matches.length - 1][1];
  }
  // 如果傳入純 ID (如 DLUnkieNc0u)
  return url.trim().replace(/\/$/, '');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inputUrl = searchParams.get('url') || 'DLUnkieNc0u';

    const shortcode = extractShortcode(inputUrl);

    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'instagram-scraper-stable-api.p.rapidapi.com';

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing RAPIDAPI_KEY in environment variables." },
        { status: 500 }
      );
    }

    const apiUrl = `https://${apiHost}/get_media_data_v2.php?media_code=${encodeURIComponent(shortcode)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
        'content-type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: "RapidAPI 返回錯誤",
        status: response.status,
        parsedShortcode: shortcode,
        debugInfo: {
          usedHost: apiHost,
          calledUrl: apiUrl
        },
        details: data
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      parsedShortcode: shortcode,
      data: data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during RapidAPI call" },
      { status: 500 }
    );
  }
}
