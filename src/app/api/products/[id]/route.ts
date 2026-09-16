import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { UpdateProductInput } from '@/lib/data/adapter';

function notFound(id: string) {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: `Product '${id}' was not found.` } },
    { status: 404 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = adapter.getProduct
    ? await adapter.getProduct(id)
    : (await adapter.listProducts()).find((row) => row.id === id) ?? null;

  if (!product) return notFound(id);
  return NextResponse.json({ data: product });
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to update products.' } },
      { status: 403 },
    );
  }
  if (!adapter.updateProduct) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Product update is not available.' } },
      { status: 501 },
    );
  }

  const { id } = await params;

  let body: UpdateProductInput;
  try {
    body = (await request.json()) as UpdateProductInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const product = await adapter.updateProduct(id, body);
    if (!product) return notFound(id);
    return NextResponse.json({ data: product });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('PATCH /api/products/[id]', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to update product.' } },
      { status: 500 },
    );
  }
}
