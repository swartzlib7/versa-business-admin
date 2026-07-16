// Next.js middleware for I5 auth boundary.
// Protects backend pages and API routes; leaves public routes open.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_CONFIG } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_PAGE_PREFIXES = [
  '/dashboard',
  '/users',
  '/agents',
  '/projects',
  '/tasks',
  '/integrations',
  '/settings',
];

const PROTECTED_API_PREFIXES = [
  '/api/agents',
  '/api/projects',
  '/api/tasks',
  '/api/integrations',
  '/api/users',
];

// Public routes (no auth)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/api/health',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/api/public',
  '/api', // API index is public
];

function isProtected(pathname: string): boolean {
  // Check public routes first
  for (const route of PUBLIC_ROUTES) {
    if (route === '/api') {
      if (pathname === '/api' || pathname === '/api/') return false;
    } else if (route === '/api/public') {
      if (pathname.startsWith('/api/public')) return false;
    } else if (route === '/api/auth') {
      // All auth routes are public
    } else if (pathname === route) {
      return false;
    }
  }

  // Check protected API routes
  for (const prefix of PROTECTED_API_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return true;
    }
  }

  // Check protected page routes
  for (const prefix of PROTECTED_PAGE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return true;
    }
  }

  return false;
}

function getSessionFromCookie(cookie: string): boolean {
  const match = cookie
    .split('; ')
    .find((c) => c.trim().startsWith(AUTH_CONFIG.cookieName + '='));
  if (!match) return false;
  const token = match.split('=')[1];
  if (!token) return false;
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.headers.get('cookie') || '';
  const hasSession = getSessionFromCookie(cookie);

  if (!hasSession) {
    // For API routes, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 },
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon.ico
     * - Public API routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
