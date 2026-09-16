import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { listObjects } from '@/lib/fixtures/catalog';

/** GET /api/catalog/objects — registry of object_api_name entries. */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const data = listObjects();
  return NextResponse.json({ data, count: data.length });
}
