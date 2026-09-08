import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import {
  getElementConfigDb,
  upsertElementConfigDb,
} from '@/lib/db/element-config-store';
import {
  getElementConfigFixture,
  upsertElementConfigFixture,
} from '@/lib/fixtures/element-config';
import { isPostgresDataSource } from '@/lib/db/data-source';

// #249 Slice E2: division configuration singleton — appointed head + deputy.
// GET is authenticated; writes are admin-only. Fixture path is DATA_SOURCE=fixture.

function usePostgres() {
  return isPostgresDataSource();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ element: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const { element } = await context.params;
  const config = usePostgres()
    ? await getElementConfigDb(element)
    : getElementConfigFixture(element);
  if (!config) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'No element_config for element.' } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: config });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ element: string }> },
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
      { error: { code: 'FORBIDDEN', message: 'Admin session required.' } },
      { status: 403 },
    );
  }
  const { element } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  const input = {
    head_user_id:
      body.head_user_id != null ? String(body.head_user_id) : undefined,
    deputy_user_id:
      body.deputy_user_id != null ? String(body.deputy_user_id) : undefined,
    config: body.config as Record<string, unknown> | undefined,
  };
  try {
    const config = usePostgres()
      ? await upsertElementConfigDb(element, input)
      : upsertElementConfigFixture(element, input);
    return NextResponse.json({ data: config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code = message.startsWith('NO_ORGANIZATION') ? 'NO_ORGANIZATION' : 'UPSERT_FAILED';
    return NextResponse.json(
      { error: { code, message } },
      { status: code === 'NO_ORGANIZATION' ? 409 : 500 },
    );
  }
}
