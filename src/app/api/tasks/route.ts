import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { CreateTaskInput } from '@/lib/data/adapter';

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
  const projectId = searchParams.get('projectId') ?? undefined;
  const priority = searchParams.get('priority') ?? undefined;
  const assignee = searchParams.get('assignee') ?? undefined;
  const q = searchParams.get('q') ?? undefined;

  const data = await adapter.listTasks({ status, projectId, priority, assignee, q });

  return NextResponse.json({
    data,
    count: data.length,
  });
}

/** Phase 3 — create task (admin only). */
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to create tasks.' } },
      { status: 403 },
    );
  }
  if (!adapter.createTask) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Task create is not available.' } },
      { status: 501 },
    );
  }

  let body: CreateTaskInput;
  try {
    body = (await request.json()) as CreateTaskInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const task = await adapter.createTask(body);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('POST /api/tasks', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to create task.' } },
      { status: 500 },
    );
  }
}
