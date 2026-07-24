import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { CreateProjectInput } from '@/lib/data/adapter';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const q = searchParams.get('q') ?? undefined;

  const data = await adapter.listProjects({ status, q });

  return NextResponse.json({
    data,
    count: data.length,
  });
}

/** Phase 3 — create project (admin only). */
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to create projects.' } },
      { status: 403 },
    );
  }
  if (!adapter.createProject) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Project create is not available.' } },
      { status: 501 },
    );
  }

  let body: CreateProjectInput;
  try {
    body = (await request.json()) as CreateProjectInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const project = await adapter.createProject(body);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('POST /api/projects', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to create project.' } },
      { status: 500 },
    );
  }
}
