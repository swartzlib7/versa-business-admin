import { NextResponse } from 'next/server';
import { integrations } from '@/lib/fixtures';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  let filtered = integrations;
  if (statusFilter) {
    filtered = integrations.filter((i) => i.status === statusFilter);
  }

  return NextResponse.json({
    data: filtered,
    count: filtered.length,
  });
}
