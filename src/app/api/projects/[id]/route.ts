import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { UpdateProjectInput } from '@/lib/data/adapter';

function notFound(id: string) {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: `Project '${id}' was not found.` } },
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

  const { id } = await params;
  const project = await adapter.getProject(id);

  if (!project) {
    return notFound(id);
  }

  // Include related tasks for convenience
  const tasks = await adapter.listTasks({ projectId: id });

  return NextResponse.json({
    data: { ...project, tasks },
  });
}

/** Phase 3 — update project (admin only). */
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to update projects.' } },
      { status: 403 },
    );
  }
  if (!adapter.updateProject) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Project update is not available.' } },
      { status: 501 },
    );
  }

  const { id } = await params;

  let body: UpdateProjectInput;
  try {
    body = (await request.json()) as UpdateProjectInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const project = await adapter.updateProject(id, body);
    if (!project) return notFound(id);
    return NextResponse.json({ data: project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('PATCH /api/projects/[id]', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to update project.' } },
      { status: 500 },
    );
  }
}
