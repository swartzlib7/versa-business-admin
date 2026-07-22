import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import {
  getValueSetByApiNameLive,
  listValueSetItemsLive,
} from '@/lib/fixtures/catalog';

/** GET /api/catalog/value-sets/:apiName — value set + active items. */
export async function GET(
  request: Request,
  context: { params: Promise<{ apiName: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { apiName } = await context.params;
  const vs = getValueSetByApiNameLive(apiName);
  if (!vs) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `Unknown value set '${apiName}'.`,
        },
      },
      { status: 404 },
    );
  }

  const items = listValueSetItemsLive(vs.id);
  return NextResponse.json({ data: { ...vs, items } });
}
