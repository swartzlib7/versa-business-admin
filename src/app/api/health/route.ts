import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data/adapter';
import { isPostgresDataSource } from '@/lib/db/data-source';
import pkg from '../../../../package.json';

export async function GET() {
  let dbStatus: { connected: boolean; latencyMs?: number; error?: string };
  try {
    dbStatus = await adapter.healthCheck();
  } catch {
    dbStatus = { connected: false, error: 'healthCheck not available' };
  }

  const healthy = !isPostgresDataSource() || dbStatus.connected;
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      version: pkg.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    },
    { status: healthy ? 200 : 503 },
  );
}
