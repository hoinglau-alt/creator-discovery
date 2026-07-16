import { NextRequest, NextResponse } from 'next/server';
import { scrapeCreators } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, category, region, targetCount = 20 } = body;

    if (!platform || !category || !region) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：platform, category, region' },
        { status: 400 }
      );
    }

    // Run scraping
    const result = await scrapeCreators(platform, category, region, targetCount);

    return NextResponse.json({
      success: true,
      data: {
        total: result.total,
        creators: result.creators,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '抓取失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
