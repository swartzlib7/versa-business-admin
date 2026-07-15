import { NextResponse } from 'next/server';
import { tasks } from '@/lib/fixtures';

export async function GET() {
  return NextResponse.json({
    data: tasks,
    count: tasks.length,
  });
}
