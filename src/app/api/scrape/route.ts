import { NextRequest, NextResponse } from 'next/server';
import { scrapeCreators } from '@/lib/scraper';
import { generateSearchKeywords } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, category, region, targetCount = 20, batchMode = false } = body;

    if (!platform || !category || !region) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：platform, category, region' },
        { status: 400 }
      );
    }

    // 批量模式：生成多个搜索关键词，并发处理
    if (batchMode) {
      const keywords = generateSearchKeywords(category, region);
      const batchSize = Math.min(keywords.length, 20); // 最多 20 个关键词
      const selectedKeywords = keywords.slice(0, batchSize);
      
      console.log(`[Scrape API] 批量模式：${selectedKeywords.length} 个关键词`);
      
      // 并发执行多个搜索任务
      const tasks = selectedKeywords.map((keyword) => ({
        platform,
        category,
        region,
        keyword,
        targetCount: Math.ceil(targetCount / batchSize),
      }));
      
      // 分批并发处理（每批 5 个）
      const results = [];
      const concurrency = 5;
      for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = tasks.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(
          batch.map((task) => scrapeCreators(task.platform, task.category, task.region, task.targetCount))
        );
        
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
        }
        
        // 避免请求过快
        if (i + concurrency < tasks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      
      // 合并结果
      const totalCreators = results.flatMap((r) => r.creators);
      const totalSources = results.flatMap((r) => r.sources);
      
      return NextResponse.json({
        success: true,
        data: {
          total: totalCreators.length,
          creators: totalCreators,
          sources: totalSources,
          batchInfo: {
            keywords: selectedKeywords.length,
            tasks: results.length,
          },
        },
      });
    }

    // 单次模式
    const result = await scrapeCreators(platform, category, region, targetCount);
    return NextResponse.json({
      success: true,
      data: {
        total: result.total,
        creators: result.creators,
        sources: result.sources,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '抓取失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
