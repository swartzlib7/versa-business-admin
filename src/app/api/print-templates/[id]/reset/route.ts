import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { resetToShipped } from '@/lib/print/template-admin';

/** POST /api/print-templates/<id>/reset (1.0.28): put a shipped template back as this release ships it. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin session required.' } }, { status: 403 });
  }
  const { id } = await context.params;
  const result = await resetToShipped(id, session?.userId ? String(session.userId) : null);
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  return NextResponse.json({ data: result.template });
}
