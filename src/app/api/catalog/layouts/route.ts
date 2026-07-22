import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { listAllLayouts, type LayoutDefinition } from '@/lib/fixtures/catalog';

/** GET /api/catalog/layouts?object=user&type=detail */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const object = searchParams.get('object') ?? undefined;
  const type = searchParams.get('type') as LayoutDefinition['layout_type'] | null;
  const data = listAllLayouts(object, type ?? undefined);
  return NextResponse.json({
    data,
    count: data.length,
    object: object ?? null,
    type: type ?? null,
  });
}
