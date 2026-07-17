import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/metrics — public metrics list (no auth required)
export async function GET() {
  const metrics = await adapter.listMetrics();
  return NextResponse.json({ data: metrics, count: metrics.length });
}
