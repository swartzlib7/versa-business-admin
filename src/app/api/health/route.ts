import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data/adapter';
import pkg from '../../../../package.json';

export async function GET() {
  // Check DB connectivity when DATA_SOURCE=postgres; fixtures always report ok.
  let dbStatus: { connected: boolean; latencyMs?: number; error?: string };
  try {
    dbStatus = await adapter.healthCheck();
  } catch {
    dbStatus = { connected: false, error: 'healthCheck not available' };
  }

  return NextResponse.json({
    status: 'ok',
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
  });
}
