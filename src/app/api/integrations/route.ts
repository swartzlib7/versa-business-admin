import { NextResponse } from 'next/server';
import { integrations } from '@/lib/fixtures';

export async function GET() {
  return NextResponse.json({
    data: integrations,
    count: integrations.length,
  });
}
