import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '0.5.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
