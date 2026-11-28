import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { listTemplates } from '@/lib/print/template-admin';

/**
 * GET /api/print-templates?type=<record type> (1.0.28): print templates (of one type), by Order,
 * each with `origin` (shipped = as the release ships it, edited = a shipped one changed here,
 * own = made here) and `can_reset`.
 */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  const type = new URL(request.url).searchParams.get('type');
  const data = await listTemplates(type);
  return NextResponse.json({ data, count: data.length });
}
