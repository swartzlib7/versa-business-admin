// #244 Slice F (D1 cutover): organization-attached record_line rows (C3
// design note). Vendor integrations live here (line_group='integrations');
// the vendor_integration record type is retired. The E1 XOR CHECK
// (record_line_parent_check) guarantees exactly one of record_id /
// organization_id per row.
import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';

type Ctx = { params: Promise<{ id: string }> };

function notImplemented() {
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Org lines are not available.' } },
    { status: 501 },
  );
}

export async function GET(request: Request, ctx: Ctx) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!adapter.listOrgLines) return notImplemented();
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const lineGroup = searchParams.get('line_group') ?? 'integrations';
  const data = await adapter.listOrgLines(id, lineGroup);
  return NextResponse.json({ data, count: data.length });
}

export async function POST(request: Request, ctx: Ctx) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required to create org lines.' } },
      { status: 403 },
    );
  }
  if (!adapter.createOrgLine) return notImplemented();
  const { id } = await ctx.params;
  let body: { line_group?: string; data?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }
  const lineGroup = body.line_group ?? 'integrations';
  if (!/^[a-z][a-z0-9_]*$/.test(lineGroup)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'line_group must be snake_case.' } },
      { status: 400 },
    );
  }
  try {
    const line = await adapter.createOrgLine(id, lineGroup, body.data ?? {});
    return NextResponse.json({ data: line }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: e instanceof Error ? e.message : 'Failed to create line.' } },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required to update org lines.' } },
      { status: 403 },
    );
  }
  if (!adapter.updateOrgLine) return notImplemented();
  const { id } = await ctx.params;
  let body: { line_id?: string; line_group?: string; data?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }
  if (!body.line_id) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'line_id is required.' } },
      { status: 400 },
    );
  }
  const lineGroup = body.line_group ?? 'integrations';
  const line = await adapter.updateOrgLine(id, body.line_id, lineGroup, body.data ?? {});
  if (!line) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Line not found.' } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: line });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required to delete org lines.' } },
      { status: 403 },
    );
  }
  if (!adapter.deleteOrgLine) return notImplemented();
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get('line_id') ?? '';
  const lineGroup = searchParams.get('line_group') ?? 'integrations';
  if (!lineId) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'line_id is required.' } },
      { status: 400 },
    );
  }
  const ok = await adapter.deleteOrgLine(id, lineId, lineGroup);
  if (!ok) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Line not found.' } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { ok: true } });
}
