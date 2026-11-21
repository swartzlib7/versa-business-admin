import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { cloneRecord } from '@/lib/records/record-actions';

/**
 * POST /api/records/<id>/clone (1.0.15): copy any record and its lines as "Copy of …" (new id, audit reset, External ID cleared).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin session required.' } }, { status: 403 });
  }
  const { id } = await context.params;
  const result = await cloneRecord(id, session?.userId ? String(session.userId) : null);
  if (!result.ok) {
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  }
  return NextResponse.json({ data: result.instance }, { status: 201 });
}
