import { NextResponse } from 'next/server';
import { getDataSourceStatus } from '@/lib/scraper';

export async function GET() {
  try {
    const status = await getDataSourceStatus();
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
