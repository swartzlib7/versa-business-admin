// #248 Slice D (rev E section 4.3, 2026-08-31): organizations CRUD.
// The Executive organizations list and the Collaboration zone rendering (C6)
// read through this route; writes are admin-only (tenant identity is
// relational, not user-editable content).
import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { CreateOrganizationInput } from '@/lib/data/types';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!adapter.listOrganizations) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Organizations list is not available.' } },
      { status: 501 },
    );
  }

  const { searchParams } = new URL(request.url);
  const orgType = searchParams.get('org_type') ?? undefined;
  const data = await adapter.listOrganizations(orgType);
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to create organizations.' } },
      { status: 403 },
    );
  }
  if (!adapter.createOrganization) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Organization create is not available.' } },
      { status: 501 },
    );
  }

  let body: CreateOrganizationInput;
  try {
    body = (await request.json()) as CreateOrganizationInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const org = await adapter.createOrganization(body);
    return NextResponse.json({ data: org }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('POST /api/organizations', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to create organization.' } },
      { status: 500 },
    );
  }
}
