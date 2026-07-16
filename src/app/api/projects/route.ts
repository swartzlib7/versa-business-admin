import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const q = searchParams.get('q') ?? undefined;

  const data = await adapter.listProjects({ status, q });

  return NextResponse.json({
    data,
    count: data.length,
  });
}
