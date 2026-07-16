import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  // Protect: require authentication
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type');

  const data = await adapter.listUsers(typeFilter ?? undefined);

  return NextResponse.json({
    data,
    count: data.length,
  });
}
