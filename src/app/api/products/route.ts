import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';
import { getSessionFromRequest, isAuthenticated, isAdmin } from '@/lib/auth';
import type { CreateProductInput } from '@/lib/data/adapter';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }

  const data = await adapter.listProducts();
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
      { error: { code: 'FORBIDDEN', message: 'Admin role required to create products.' } },
      { status: 403 },
    );
  }
  if (!adapter.createProduct) {
    return NextResponse.json(
      { error: { code: 'NOT_IMPLEMENTED', message: 'Product create is not available.' } },
      { status: 501 },
    );
  }

  let body: CreateProductInput;
  try {
    body = (await request.json()) as CreateProductInput;
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON body.' } },
      { status: 400 },
    );
  }

  try {
    const product = await adapter.createProduct(body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: msg.replace(/^VALIDATION:\s*/, '') } },
        { status: 400 },
      );
    }
    console.error('POST /api/products', e);
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to create product.' } },
      { status: 500 },
    );
  }
}
