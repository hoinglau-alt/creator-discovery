import { NextRequest, NextResponse } from 'next/server';
import { mockCreators } from '@/lib/mock-data';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const creator = mockCreators.find((c) => c.id === id);

  if (!creator) {
    return NextResponse.json({ success: false, error: 'Creator not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: creator });
}
