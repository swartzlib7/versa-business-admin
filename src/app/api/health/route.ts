import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '0.7.28',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
