import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  addValueSetItem,
  countValueSetItemReferences,
  deleteValueSetItem,
  getValueSetByApiNameLive,
  listValueSetItemsLive,
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
  const vs = getValueSetByApiNameLive(apiName);
  if (!vs) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Unknown value set '${apiName}'.` } },
      { status: 404 },
    );
  }
  const items = listValueSetItemsLive(vs.id);
  return NextResponse.json({ data: { ...vs, items } });
}

export async function POST(
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
  let body: { api_value?: string; label?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  if (!body.api_value || !body.label) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Required: api_value, label.' } },
      { status: 400 },
    );
  }
  const result = addValueSetItem(apiName, {
    api_value: body.api_value,
    label: body.label,
    sort_order: body.sort_order,
  });
  if (!result.ok) {
    const status = result.code === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status },
    );
  }
  return NextResponse.json(
    {
      data: { ...result.value_set, items: result.items },
      meta: { persistence: 'fixture_process_memory' },
    },
    { status: 201 },
  );
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
  let body: { api_value?: string; replacement_api_value?: string | null } = {};
  try {
    const textBody = await request.text();
    if (textBody.trim()) body = JSON.parse(textBody);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON when provided.' } },
      { status: 400 },
    );
  }
  // Also accept query params for simple clients
  const url = new URL(request.url);
  const api_value = body.api_value || url.searchParams.get('api_value') || '';
  const replacement =
    body.replacement_api_value !== undefined
      ? body.replacement_api_value
      : url.searchParams.get('replacement_api_value');
  if (!api_value) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Required: api_value. Optional: replacement_api_value when references exist.' } },
      { status: 400 },
    );
  }
  // Pre-check references so UI can prompt without a failed delete when possible
  if (!replacement) {
    const refs = countValueSetItemReferences(apiName, api_value);
    if (refs > 0) {
      const vs = getValueSetByApiNameLive(apiName);
      const items = vs ? listValueSetItemsLive(vs.id).filter((i) => i.api_value !== api_value) : [];
      return NextResponse.json(
        {
          error: {
            code: 'REPLACEMENT_REQUIRED',
            message: `Option '${api_value}' is used by ${refs} reference(s). Pick a replacement from the remaining options.`,
            reference_count: refs,
            remaining_options: items.map((i) => ({ api_value: i.api_value, label: i.label })),
          },
        },
        { status: 409 },
      );
    }
  }
  const result = deleteValueSetItem(apiName, api_value, replacement);
  if (!result.ok) {
    const status =
      result.code === 'NOT_FOUND' || result.code === 'ITEM_NOT_FOUND'
        ? 404
        : result.code === 'REPLACEMENT_REQUIRED'
          ? 409
          : 400;
    const vs = getValueSetByApiNameLive(apiName);
    const items = vs ? listValueSetItemsLive(vs.id).filter((i) => i.api_value !== api_value) : [];
    return NextResponse.json(
      {
        error: {
          code: result.code,
          message: result.message,
          reference_count: result.reference_count,
          remaining_options: items.map((i) => ({ api_value: i.api_value, label: i.label })),
        },
      },
      { status },
    );
  }
  return NextResponse.json({
    data: { ...result.value_set, items: result.items },
    meta: { persistence: 'fixture_process_memory', remapped: result.remapped },
  });
}
