import { NextRequest, NextResponse } from 'next/server';
import { mockCreators } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const region = searchParams.get('region');
  const category = searchParams.get('category');

  let result = [...mockCreators];

  if (platform) {
    result = result.filter((c) => c.platform === platform);
  }
  if (region) {
    result = result.filter((c) => c.region === region);
  }
  if (category) {
    result = result.filter((c) => c.categories.includes(category as never));
  }

  return NextResponse.json({ success: true, data: result, total: result.length });
}
