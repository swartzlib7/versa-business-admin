import { NextResponse } from 'next/server';

// /api/agents/[id] is deprecated — agents are users with type=agent.
// Use GET /api/users/[id] instead.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = new URL(`/api/users/${id}`, request.url);
  return NextResponse.redirect(target, { status: 308 });
}

// PATCH /api/agents/[id] is deprecated — use PATCH /api/users/[id] instead.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = new URL(`/api/users/${id}`, request.url);
  return NextResponse.redirect(target, { status: 308 });
}
