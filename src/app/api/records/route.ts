import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  listInstances,
  createInstance,
  type CreateInstanceInput,
} from '@/lib/fixtures/record-instances';

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
  const data = listInstances({ type_api_name, parent_kind, parent_api_name });
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
  const result = createInstance({
    type_api_name: String(body.type_api_name || ''),
    parent_kind: String(body.parent_kind || ''),
    parent_api_name: String(body.parent_api_name || ''),
    name: String(body.name || ''),
    status: body.status != null ? String(body.status) : undefined,
    data: body.data as Record<string, string> | undefined,
    lines: body.lines as Array<{ line_group?: string; data: Record<string, string> }> | undefined,
  } satisfies CreateInstanceInput);
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
