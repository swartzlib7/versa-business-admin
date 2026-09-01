import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getInstance,
  updateInstance,
  deleteInstance,
  type UpdateInstanceInput,
} from '@/lib/fixtures/record-instances';
import { adapter } from '@/lib/data/adapter';

// #245 Slice E1 (rev E section 4.2): Horizon 1 persistence. When the adapter
// implements the record methods (DATA_SOURCE=postgres), reads/writes go through
// record_type/record/record_line; otherwise the fixture path is unchanged.

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
  if (adapter.getRecord) {
    const instance = await adapter.getRecord(id);
    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Instance '${id}' not found.` } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: instance, meta: { persistence: 'horizon1_db' } });
  }
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
  const input = {
    name: body.name != null ? String(body.name) : undefined,
    status: body.status != null ? String(body.status) : undefined,
    data: body.data as Record<string, string> | undefined,
    lines: body.lines as Array<{ line_group?: string; data: Record<string, string> }> | undefined,
    // #249 Slice E2 (rev E section 2.5/3.2): org move + relations replace-in-full
    // (fixture path ignores both).
    org_id: body.org_id != null ? String(body.org_id) : undefined,
    relations: body.relations as Array<{
      record_id?: string;
      organization_id?: string;
      relation_kind?: string;
    }> | undefined,
  } satisfies UpdateInstanceInput;
  if (adapter.updateRecord) {
    const result = await adapter.updateRecord(id, input);
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status },
      );
    }
    return NextResponse.json({ data: result.instance, meta: { persistence: 'horizon1_db' } });
  }
  const result = updateInstance(id, input);
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
  if (adapter.deleteRecord) {
    const deleted = await adapter.deleteRecord(id);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Instance '${id}' not found.` } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: { deleted: true, id }, meta: { persistence: 'horizon1_db' } });
  }
  const deleted = deleteInstance(id);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Instance '${id}' not found.` } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { deleted: true, id } });
}
