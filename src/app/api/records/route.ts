import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  listInstances,
  createInstance,
  type CreateInstanceInput,
} from '@/lib/fixtures/record-instances';
import { adapter, type RecordFilters } from '@/lib/data/adapter';

// #245 Slice E1 (rev E section 4.2): Horizon 1 persistence. When the adapter
// implements the record methods (DATA_SOURCE=postgres), reads/writes go through
// record_type/record/record_line; otherwise the fixture path is unchanged.

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const { searchParams } = new URL(request.url);
  const type_api_name = searchParams.get('type') ?? undefined;
  const parent_kind = searchParams.get('parent_kind') ?? undefined;
  const parent_api_name = searchParams.get('parent') ?? undefined;
  const filters: RecordFilters = { type_api_name, parent_kind, parent_api_name };
  if (adapter.listRecords) {
    const data = await adapter.listRecords(filters);
    return NextResponse.json({ data, count: data.length, meta: { persistence: 'horizon1_db' } });
  }
  const data = listInstances(filters);
  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: Request) {
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
    type_api_name: String(body.type_api_name || ''),
    parent_kind: String(body.parent_kind || ''),
    parent_api_name: String(body.parent_api_name || ''),
    name: String(body.name || ''),
    status: body.status != null ? String(body.status) : undefined,
    data: body.data as Record<string, string> | undefined,
    lines: body.lines as Array<{ line_group?: string; data: Record<string, string> }> | undefined,
    // #249 Slice E2 (rev E section 2.5/3.2): explicit org override + executive
    // relations (fixture path ignores both).
    org_id: body.org_id != null ? String(body.org_id) : undefined,
    relations: body.relations as Array<{
      record_id?: string;
      organization_id?: string;
      relation_kind?: string;
    }> | undefined,
  } satisfies CreateInstanceInput;
  if (adapter.createRecord) {
    const result = await adapter.createRecord(input, {
      createdBy: session?.userId ?? null,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { data: result.instance, meta: { persistence: 'horizon1_db' } },
      { status: 201 },
    );
  }
  const result = createInstance(input);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { data: result.instance, meta: { persistence: 'fixture_process_memory' } },
    { status: 201 },
  );
}
