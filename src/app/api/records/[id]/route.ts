import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getInstance,
  updateInstance,
  deleteInstance,
  type UpdateInstanceInput,
} from '@/lib/fixtures/record-instances';
import { adapter } from '@/lib/data/adapter';
import { getSiteSettingsFixture } from '@/lib/fixtures/site-settings';
import { normalizePageBuilder, pairingCellUsages } from '@/lib/public/page-builder';

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
  const incoming =
    typeof body.data === 'object' && body.data && !Array.isArray(body.data)
      ? { ...(body.data as Record<string, string>) }
      : undefined;
  if (incoming) {
    delete incoming.created_by;
    delete incoming.created_at;
    delete incoming.id;
  }
  const current = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id);
  const currentData = (current?.data ?? {}) as Record<string, string>;
  const data =
    incoming !== undefined || session?.userId
      ? {
          ...currentData,
          ...(incoming ?? {}),
          ...(currentData.created_by ? { created_by: currentData.created_by } : {}),
          ...(currentData.created_at ? { created_at: currentData.created_at } : {}),
          ...(currentData.id ? { id: currentData.id } : { id }),
          ...(session?.userId ? { last_modified_by: String(session.userId) } : {}),
          updated_at: new Date().toISOString(),
        }
      : undefined;
  const input = {
    name: body.name != null ? String(body.name) : undefined,
    status: body.status != null ? String(body.status) : undefined,
    data,
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
  const existing = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id);
  if (existing?.type_api_name === 'driver_pairing') {
    const pb = normalizePageBuilder(getSiteSettingsFixture().page_builder);
    const usages = pairingCellUsages(pb, id);
    if (usages.length) {
      const first = usages[0];
      return NextResponse.json(
        {
          error: {
            code: 'PAIRING_IN_USE',
            message: `Unbind this pairing from ${usages.length} Cell${usages.length === 1 ? '' : 's'} first (e.g. ${first.canvas} / ${first.rowLabel} / Cell ${first.cellIndex + 1}).`,
            usages,
          },
        },
        { status: 409 },
      );
    }
  }
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
