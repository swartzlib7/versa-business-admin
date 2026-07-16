import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/business — public business profile (no auth required)
export async function GET() {
  const business = await adapter.getBusinessProfile();
  return NextResponse.json({ data: business });
}
