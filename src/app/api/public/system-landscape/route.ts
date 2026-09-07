import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

/** Canonical public name for the System Landscape facet (0.7.141). */
export async function GET() {
  const systems = await adapter.listOtherSystems();
  return NextResponse.json({ data: systems, count: systems.length });
}
