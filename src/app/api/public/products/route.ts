import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/products — public product list (no auth required)
export async function GET() {
  const products = await adapter.listProducts();
  return NextResponse.json({ data: products, count: products.length });
}
