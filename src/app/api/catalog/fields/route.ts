import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  extendFieldDefinition,
  listAllFieldDefinitions,
  type CatalogDataType,
  type ExtendFieldInput,
} from '@/lib/fixtures/catalog';

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

  let body: Partial<ExtendFieldInput>;
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

  const result = extendFieldDefinition({
    object_api_name: body.object_api_name,
    api_name: body.api_name,
    label: body.label,
    data_type: body.data_type as CatalogDataType,
    is_required: body.is_required,
    default_value: body.default_value,
    value_set_api_name: body.value_set_api_name,
    lookup_object_api_name: body.lookup_object_api_name,
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
