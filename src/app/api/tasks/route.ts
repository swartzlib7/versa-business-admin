import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  const data = await adapter.listTasks(statusFilter ?? undefined);

  return NextResponse.json({
    data,
    count: data.length,
  });
}
