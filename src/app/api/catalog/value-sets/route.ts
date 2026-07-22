import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { listAllValueSets } from '@/lib/fixtures/catalog';

/** GET /api/catalog/value-sets */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const data = listAllValueSets();
  return NextResponse.json({ data, count: data.length });
}
