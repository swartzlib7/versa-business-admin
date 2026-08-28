import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  extendFieldDefinition,
  listAllFieldDefinitions,
  ensureObjectForRecordType,
  getObject,
  type CatalogDataType,
  type ExtendFieldInput,
} from '@/lib/fixtures/catalog';
import { getRecordType } from '@/lib/fixtures/record-types';

/** GET /api/catalog/fields?object=user — field definitions (optional object filter). */
export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const object = searchParams.get('object') ?? undefined;
  const data = listAllFieldDefinitions(object);
  return NextResponse.json({ data, count: data.length, object: object ?? null });
}

/**
 * POST /api/catalog/fields — extend an object with a custom field definition.
 * Agents/admins use this after reading schema. Fixture-local until DB catalog.
 */
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
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Admin session required to extend catalog fields.',
        },
      },
      { status: 403 },
    );
  }

  let body: Partial<ExtendFieldInput> & { zone_role?: "header" | "list" | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }

  if (!body.object_api_name || !body.api_name || !body.label || !body.data_type) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION',
          message:
            'Required: object_api_name, api_name, label, data_type. Optional: is_required, default_value, value_set_api_name, lookup_object_api_name.',
        },
      },
      { status: 400 },
    );
  }

  // F3 repair-on-write: if object missing but a record type owns this api_name, register it
  const objectApiName = String(body.object_api_name);
  if (!getObject(objectApiName)) {
    const rt = getRecordType(objectApiName);
    if (rt) {
      ensureObjectForRecordType({
        api_name: rt.object_api_name || rt.api_name,
        label: rt.label,
        description: rt.description,
        faculty: rt.parent_kind === 'faculty' ? rt.parent_api_name : undefined,
      });
    }
  }

  const result = extendFieldDefinition({
    object_api_name: objectApiName,
    api_name: body.api_name,
    label: body.label,
    data_type: body.data_type as CatalogDataType,
    is_required: body.is_required,
    default_value: body.default_value,
    value_set_api_name: body.value_set_api_name,
    lookup_object_api_name: body.lookup_object_api_name,
    // N4: honor explicit placement from the create flow; default to Header on
    // header_lines types (L2) so a new field is never left unassigned.
    zone_role: body.zone_role === "list" || body.zone_role === "header"
      ? body.zone_role
      : (() => { const rt = getRecordType(objectApiName); return rt && rt.structure === "header_lines" ? "header" : null; })(),
    // O1: explicit lines-table column flag (list-zone fields).
    show_in_column: body.show_in_column,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      data: result.field,
      meta: {
        persistence: 'fixture_process_memory',
        note: 'Survives until process restart. Phase 2+ will persist catalog tables.',
      },
    },
    { status: 201 },
  );
}
