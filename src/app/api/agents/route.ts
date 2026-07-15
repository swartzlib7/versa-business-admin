import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';

export async function GET() {
  return NextResponse.json({
    data: agents,
    count: agents.length,
  });
}
