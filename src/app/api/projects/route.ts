import { NextResponse } from 'next/server';
import { projects } from '@/lib/fixtures';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  let filtered = projects;
  if (statusFilter) {
    filtered = projects.filter((p) => p.status === statusFilter);
  }

  return NextResponse.json({
    data: filtered,
    count: filtered.length,
  });
}
