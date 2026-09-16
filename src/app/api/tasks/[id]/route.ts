import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { UpdateTaskInput } from '@/lib/data/adapter';

function notFound(id: string) {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: `Task '${id}' was not found.` } },
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
  const task = await adapter.getTask(id);

  if (!task) {
    return notFound(id);
  }

  return NextResponse.json({ data: task });
}

/** Phase 3 — update task (admin or assignee). */
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

  const { id } = await params;

  // Check if user is admin or assignee of this task
  const task = await adapter.getTask(id);
  if (!task) return notFound(id);

  const isAssignee = session!.userId === task.assigneeUserId;
  if (!isAdmin(session) && !isAssignee) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin or assignee required to update task.' } },
      { status: 403 },
    );
  }

  if (!adapter.updateTask) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Task update is not available.' } },
      { status: 501 },
    );
  }

  let body: UpdateTaskInput;
  try {
    body = (await request.json()) as UpdateTaskInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  // Non-admin assignees can only update status
  if (!isAdmin(session)) {
    const allowed: (keyof UpdateTaskInput)[] = ['status'];
    const keys = Object.keys(body) as (keyof UpdateTaskInput)[];
    const disallowed = keys.filter((k) => !allowed.includes(k));
    if (disallowed.length > 0) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Assignees can only update task status.' } },
        { status: 403 },
      );
    }
  }

  try {
    const updated = await adapter.updateTask(id, body);
    if (!updated) return notFound(id);
    return NextResponse.json({ data: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('PATCH /api/tasks/[id]', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to update task.' } },
      { status: 500 },
    );
  }
}
