import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({
    success: true,
    data: {
      total: 3,
      stored: 0,
      skipped: 0,
      creators: [
        {
          name: 'Test Creator 1',
          handle: '@test1',
          subscribers: 10000,
          contacts: ['test1@example.com'],
          stored: false,
        },
        {
          name: 'Test Creator 2',
          handle: '@test2',
          subscribers: 50000,
          contacts: ['test2@example.com'],
          stored: false,
        },
      ],
    },
  });
}
