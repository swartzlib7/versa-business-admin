import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  listInstances,
  createInstance,
  type CreateInstanceInput,
} from '@/lib/fixtures/record-instances';
import { adapter, type RecordFilters } from '@/lib/data/adapter';
import { DRIVER_PAIRING_TYPE, inferSelectionMode } from '@/lib/public/driver-pairings';
import {
  catalogAllowsDriverPair,
  conflictingDriver,
  driverConflictMessage,
  listDriverRecords,
} from '@/lib/public/driver-unique';
import {
  conflictingPairing,
  listPairingRecords,
  pairingConflictMessage,
} from '@/lib/public/pairing-unique';
import { catalogIdFromPair } from '@/lib/public/render-drivers';
import { RENDER_DRIVER_TYPE } from '@/lib/public/render-driver-locks';
import { stampPairingFromDriver } from '@/lib/public/stamp-pairing-record';

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
  let pairingData =
    typeof body.data === 'object' && body.data && !Array.isArray(body.data)
      ? { ...(body.data as Record<string, string>) }
      : {};
  if (String(body.type_api_name || '') === DRIVER_PAIRING_TYPE) {
    const stamped = await stampPairingFromDriver(pairingData);
    if (!stamped.ok) {
      return NextResponse.json(
        { error: { code: 'INVALID_PAIRING', message: stamped.message } },
        { status: 400 },
      );
    }
    pairingData = stamped.data;
    const existing = conflictingPairing(
      await listPairingRecords(),
      String(pairingData.target_record_type ?? ''),
      String(pairingData.target_record_id ?? ''),
      String(pairingData.driver_id ?? ''),
      undefined,
      inferSelectionMode(
        String(pairingData.selection_mode ?? ''),
        String(pairingData.target_record_id ?? ''),
        pairingData.filter_json,
      ),
      pairingData.filter_json,
    );
    if (existing) {
      return NextResponse.json(
        { error: { code: 'PAIRING_EXISTS', message: pairingConflictMessage(existing) } },
        { status: 409 },
      );
    }
  }
  if (String(body.type_api_name || '') === RENDER_DRIVER_TYPE) {
    const shape = String(pairingData.bind_shape ?? '');
    const recordType = String(pairingData.compatible_record_type ?? '');
    if (!catalogAllowsDriverPair(shape, recordType)) {
      return NextResponse.json(
        { error: { code: 'INVALID_DRIVER', message: 'That Shape and Record type pair is not a released driver.' } },
        { status: 400 },
      );
    }
    const catalogId = catalogIdFromPair(shape, recordType);
    if (catalogId) pairingData.code_key = catalogId;
    const existing = conflictingDriver(await listDriverRecords(), shape, recordType);
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DRIVER_EXISTS', message: driverConflictMessage(existing) } },
        { status: 409 },
      );
    }
  }
  const input = {
    type_api_name: String(body.type_api_name || ''),
    parent_kind: String(body.parent_kind || ''),
    parent_api_name: String(body.parent_api_name || ''),
    name: String(body.name || ''),
    status: body.status != null ? String(body.status) : undefined,
    data: {
      ...pairingData,
      ...(session?.userId
        ? { created_by: String(session.userId), last_modified_by: String(session.userId) }
        : {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
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
