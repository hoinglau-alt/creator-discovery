import { NextRequest, NextResponse } from 'next/server';
import { scrapeCreators, createScrapeJob } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, category, region, targetCount = 20 } = body;

    if (!platform || !category || !region) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: platform, category, region' },
        { status: 400 }
      );
    }

    // Create a job record
    const jobId = await createScrapeJob(platform, category, region, targetCount);

    // Start scraping (non-blocking, run in background)
    // For now, run synchronously since we need to return results
    const result = await scrapeCreators(platform, category, region, targetCount, jobId);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        scraped: result.scraped,
        creators: result.creators,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '抓取失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
