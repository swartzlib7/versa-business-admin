import { NextResponse } from 'next/server';

// /api/agents is deprecated — agents are users with type=agent.
// Use GET /api/users?type=agent instead.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const target = new URL('/api/users', request.url);
  target.searchParams.set('type', 'agent');
  if (status) target.searchParams.set('status', status);
  return NextResponse.redirect(target, { status: 308 });
}
