import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/services — public service list (no auth required)
export async function GET() {
  const services = await adapter.listServices();
  return NextResponse.json({ data: services, count: services.length });
}
