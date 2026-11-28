import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { printTemplatesFor } from '@/lib/print/print-record';

/**
 * GET /api/records/<id>/print-templates (1.0.27): the print templates this record can use, the
 * one to use first (`default`); `matches` marks those whose Use when fits the record.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  const { id } = await context.params;
  const found = await printTemplatesFor(id);
  if (!found.ok) return NextResponse.json({ error: { code: found.code, message: found.message } }, { status: found.status });
  return NextResponse.json({ data: found.templates });
}
