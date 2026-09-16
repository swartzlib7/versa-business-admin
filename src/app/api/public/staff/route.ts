import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/staff — public staff list (no auth required)
// Per boundary #5-6: users and agents differ only by type field.
// No agent-management chrome on public endpoints.
export async function GET() {
  const staff = await adapter.listStaff();
  return NextResponse.json({ data: staff, count: staff.length });
}
