import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { createShipmentFromInvoice } from '@/lib/records/record-actions';

/**
 * POST /api/records/<id>/shipment (1.0.26): a Draft shipment of what an invoice still owes (Production → Shipments). 409 NOTHING_TO_SHIP when every line is already on a shipment.
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
  const result = await createShipmentFromInvoice(id, session?.userId ? String(session.userId) : null);
  if (!result.ok) {
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  }
  return NextResponse.json({ data: result.instance }, { status: 201 });
}
