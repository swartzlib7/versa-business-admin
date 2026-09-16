import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import { createValueSet, listAllValueSets } from '@/lib/fixtures/catalog';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const data = listAllValueSets();
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
  let body: {
    api_name?: string;
    label?: string;
    description?: string;
    items?: Array<{ api_value: string; label: string; sort_order?: number }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  if (!body.api_name || !body.label) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION',
          message: 'Required: api_name, label. Optional: description, items[].',
        },
      },
      { status: 400 },
    );
  }
  const result = createValueSet({
    api_name: body.api_name,
    label: body.label,
    description: body.description,
    items: body.items,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: 400 },
    );
  }
  return NextResponse.json(
    {
      data: { ...result.value_set, items: result.items },
      meta: { persistence: 'durable_catalog' },
    },
    { status: 201 },
  );
}
