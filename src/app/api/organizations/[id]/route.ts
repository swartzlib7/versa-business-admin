// #248 Slice D (rev E section 4.3): single organization read + update.
import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { UpdateOrganizationInput } from '@/lib/data/types';

function notFound(id: string) {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Organization ' + id + ' was not found.' } },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!adapter.getOrganization) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Organization get is not available.' } },
      { status: 501 },
    );
  }

  const { id } = await params;
  const org = await adapter.getOrganization(id);
  if (!org) return notFound(id);
  return NextResponse.json({ data: org });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to update organizations.' } },
      { status: 403 },
    );
  }
  if (!adapter.updateOrganization) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Organization update is not available.' } },
      { status: 501 },
    );
  }

  const { id } = await params;
  let body: UpdateOrganizationInput;
  try {
    body = (await request.json()) as UpdateOrganizationInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const org = await adapter.updateOrganization(id, body);
    if (!org) return notFound(id);
    return NextResponse.json({ data: org });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('PATCH /api/organizations/[id]', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to update organization.' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to delete organizations.' } },
      { status: 403 },
    );
  }
  if (!adapter.deleteOrganization) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Organization delete is not available.' } },
      { status: 501 },
    );
  }

  const { id } = await params;
  try {
    const ok = await adapter.deleteOrganization(id);
    if (!ok) return notFound(id);
    return NextResponse.json({ data: { id, deleted: true } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('DELETE /api/organizations/[id]', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to delete organization.' } },
      { status: 500 },
    );
  }
}
