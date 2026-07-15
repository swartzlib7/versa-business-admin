import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  let filtered = agents;
  if (statusFilter) {
    filtered = agents.filter((a) => a.status === statusFilter);
  }

  return NextResponse.json({
    data: filtered,
    count: filtered.length,
  });
}
