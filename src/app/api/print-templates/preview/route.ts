import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { previewDraft } from '@/lib/print/print-record';

/**
 * POST /api/print-templates/preview { record_id, template: { target_record_type, layout, page_size, … } }
 * (1.0.28): a record printed with a template that is not saved yet, as a PDF. The template maker's
 * preview; nothing is stored.
 */
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  let body: { record_id?: unknown; template?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } }, { status: 400 });
  }
  const recordId = typeof body.record_id === 'string' ? body.record_id.trim() : '';
  if (!recordId || !body.template || typeof body.template !== 'object') {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Send { "record_id": …, "template": { … } }.' } }, { status: 400 });
  }
  const printed = await previewDraft(recordId, body.template as Record<string, unknown>);
  if (!printed.ok) return NextResponse.json({ error: { code: printed.code, message: printed.message } }, { status: printed.status });
  return new Response(new Uint8Array(printed.pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="preview.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Print-Pages': String(printed.pages),
    },
  });
}
