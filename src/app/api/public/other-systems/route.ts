import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/other-systems — public other systems list (no auth required)
export async function GET() {
  const systems = await adapter.listOtherSystems();
  return NextResponse.json({ data: systems, count: systems.length });
}
