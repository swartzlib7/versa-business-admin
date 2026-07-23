import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getRecordType,
  updateRecordType,
  type RecordStructure,
} from '@/lib/fixtures/record-types';
import { listAllFieldDefinitions, getObjectSchema } from '@/lib/fixtures/catalog';

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
