// Auth library for I5 skeleton.
// Fixture-backed session management using httpOnly cookies.
// When a real backend is connected, swap verifyCredentials + createSession
// with real JWT/OAuth + DB lookups.

import { users as userFixtures } from "@/lib/fixtures/users";
import type { Session, User } from "@/lib/data";

const SESSION_COOKIE = "versa_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple base64 encoding for the session token (not secure crypto — fixture only).
function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

function decodeSession(token: string): Session | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

export function verifyCredentials(email: string, password: string): User | null {
  const user = userFixtures.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user || user.status !== "active") return null;
  // Strip password before returning
  const { password: _pw, ...userWithoutPw } = user;
  return userWithoutPw;
}

export function createSessionToken(user: User): string {
  const session: Session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    type: user.type,
  };
  return encodeSession(session);
}

export function getSessionFromToken(token: string | undefined): Session | null {
  if (!token) return null;
  return decodeSession(token);
}

export function getSessionFromRequest(request: Request): Session | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie
    .split("; ")
    .find((c) => c.trim().startsWith(SESSION_COOKIE + "="));
  if (!match) return null;
  const token = match.split("=")[1];
  return decodeSession(token);
}

export const AUTH_CONFIG = {
  cookieName: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
};

export function createSessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function createClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// RBAC helpers
export function isAdmin(session: Session | null): boolean {
  return session?.role === "admin";
}

export function isAuthenticated(session: Session | null): boolean {
  return session !== null;
}
