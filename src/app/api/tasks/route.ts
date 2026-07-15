import { NextResponse } from 'next/server';
import { tasks } from '@/lib/fixtures';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  let filtered = tasks;
  if (statusFilter) {
    filtered = tasks.filter((t) => t.status === statusFilter);
  }

  return NextResponse.json({
    data: filtered,
    count: filtered.length,
  });
}
