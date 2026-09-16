import { NextResponse } from 'next/server';
import pkg from '../../../package.json';
import { apiIndexPayload } from '@/lib/api/inventory';

export async function GET() {
  return NextResponse.json(apiIndexPayload(pkg.version));
}
