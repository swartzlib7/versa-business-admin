import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/support-tickets — public support ticket list (no auth required)
export async function GET() {
  const tickets = await adapter.listSupportTickets();
  return NextResponse.json({ data: tickets, count: tickets.length });
}
