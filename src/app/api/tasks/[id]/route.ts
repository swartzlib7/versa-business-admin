import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';

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
