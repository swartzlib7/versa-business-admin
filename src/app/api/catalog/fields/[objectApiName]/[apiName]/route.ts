import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import { deleteFieldDefinition, retireFieldDefinition, updateFieldDefinition, type UpdateFieldInput } from '@/lib/fixtures/catalog';

export async function PATCH(request: Request, context: { params: Promise<{ objectApiName: string; apiName: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin session required.' } }, { status: 403 });
  const { objectApiName, apiName } = await context.params;
  let body: UpdateFieldInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } }, { status: 400 }); }
  const result = updateFieldDefinition(objectApiName, apiName, body);
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message, references: result.references ?? 0 } }, { status: result.code === 'NOT_FOUND' ? 404 : 400 });
  return NextResponse.json({ data: result.field, meta: { references: result.references } });
}

export async function DELETE(request: Request, context: { params: Promise<{ objectApiName: string; apiName: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin session required.' } }, { status: 403 });
  const { objectApiName, apiName } = await context.params;
  let body: { hard_delete?: boolean } = {};
  try { body = await request.json(); } catch { /* empty body means retirement */ }
  const result = body.hard_delete ? deleteFieldDefinition(objectApiName, apiName) : retireFieldDefinition(objectApiName, apiName);
  if (!result.ok) return NextResponse.json({ error: { code: result.code, message: result.message, references: result.references ?? 0 } }, { status: result.code === 'NOT_FOUND' ? 404 : 409 });
  return NextResponse.json({ data: result.field, meta: { retired: !body.hard_delete, references: result.references } });
}
