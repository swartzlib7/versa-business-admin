import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { getObjectSchema } from '@/lib/fixtures/catalog';

/** GET /api/catalog/objects/:objectApiName — full schema bundle for one object. */
export async function GET(
  request: Request,
  context: { params: Promise<{ objectApiName: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const { objectApiName } = await context.params;
  const schema = getObjectSchema(objectApiName);
  if (!schema) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `Unknown object_api_name '${objectApiName}'.`,
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: schema });
}
