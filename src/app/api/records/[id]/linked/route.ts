import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { linkedFrom } from '@/lib/records/linked-from';

/** GET /api/records/<id>/linked (1.0.15): records whose lookup fields point at this record, grouped by type and field. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  const { id } = await context.params;
  const result = await linkedFrom(id);
  if (!result) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: `Record '${id}' not found.` } }, { status: 404 });
  }
  return NextResponse.json({ data: result.groups });
}
