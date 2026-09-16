import { NextResponse } from 'next/server';
import { createClearSessionCookieHeader } from '@/lib/auth';

export async function POST() {
  const headers = new Headers();
  headers.append('Set-Cookie', createClearSessionCookieHeader());

  return NextResponse.json({ data: { message: 'Logged out successfully.' } }, { headers });
}
