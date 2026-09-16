import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getRecordType,
  updateRecordType,
  deleteRecordType,
  type RecordStructure,
} from '@/lib/fixtures/record-types';
import {
  listAllFieldDefinitions,
  getObjectSchema,
  normalizeZoneRoles,
  ensureObjectForRecordType,
} from '@/lib/fixtures/catalog';

export async function GET(
  request: Request,
  context: { params: Promise<{ apiName: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { apiName } = await context.params;
  const type = getRecordType(apiName);
  if (!type) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `Unknown record type '${apiName}'.`,
        },
      },
      { status: 404 },
    );
  }
  // F3 repair: ensure catalog object exists for legacy custom types
  ensureObjectForRecordType({
    api_name: type.object_api_name || type.api_name,
    label: type.label,
    description: type.description,
    faculty: type.parent_kind === 'faculty' ? type.parent_api_name : undefined,
  });
  if (type.structure === "header_lines") normalizeZoneRoles(type.object_api_name);
  const fields = listAllFieldDefinitions(type.object_api_name);
  const schema = getObjectSchema(type.object_api_name);
  return NextResponse.json({ data: { type, fields, schema } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ apiName: string }> },
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

  const { apiName } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }

  const result = updateRecordType(apiName, {
    label: body.label != null ? String(body.label) : undefined,
    description: body.description != null ? String(body.description) : undefined,
    structure: body.structure as RecordStructure | undefined,
    show_as_tab: body.show_as_tab as boolean | undefined,
    sort_order: body.sort_order != null ? Number(body.sort_order) : undefined,
    active: body.active as boolean | undefined,
  });

  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status },
    );
  }

  return NextResponse.json({ data: result.type });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ apiName: string }> },
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

  const { apiName } = await context.params;
  let hardDelete = true;
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && 'hard_delete' in body) {
      hardDelete = Boolean((body as { hard_delete?: boolean }).hard_delete);
    }
  } catch {
    // empty body defaults to hard delete
  }

  if (!hardDelete) {
    const result = updateRecordType(apiName, { active: false, show_as_tab: false });
    if (!result.ok) {
      const status = result.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json(
        { error: { code: result.code, message: result.message } },
        { status },
      );
    }
    return NextResponse.json({ data: result.type, meta: { retired: true } });
  }

  const result = deleteRecordType(apiName);
  if (!result.ok) {
    const status =
      result.code === 'NOT_FOUND' ? 404 : result.code === 'SYSTEM_TYPE' ? 403 : 400;
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status },
    );
  }
  return NextResponse.json({
    data: result.type,
    meta: { hard_deleted: true, cascade: result.cascade },
  });
}
