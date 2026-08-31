import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getInstance,
  updateInstance,
  deleteInstance,
  type UpdateInstanceInput,
} from '@/lib/fixtures/record-instances';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const instance = getInstance(id);
  if (!instance) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Instance '${id}' not found.` } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: instance });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin session required.' } },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  const result = updateInstance(id, {
    name: body.name != null ? String(body.name) : undefined,
    status: body.status != null ? String(body.status) : undefined,
    data: body.data as Record<string, string> | undefined,
    lines: body.lines as Array<{ line_group?: string; data: Record<string, string> }> | undefined,
  } satisfies UpdateInstanceInput);
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status },
    );
  }
  return NextResponse.json({ data: result.instance });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin session required.' } },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  const deleted = deleteInstance(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Instance '${id}' not found.` } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { deleted: true, id } });
}
