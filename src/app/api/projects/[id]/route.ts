import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';

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
