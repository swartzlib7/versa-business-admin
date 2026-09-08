// Auth library. Postgres is the shipped default; DATA_SOURCE=fixture is opt-in.

import { users as userFixtures } from "@/lib/fixtures/users";
import type { Session, User } from "@/lib/data";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { users as usersTable, departments as departmentsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isPostgresDataSource } from "@/lib/db/data-source";

// Firebase Hosting only forwards `__session` to Cloud Functions / Cloud Run.
// Any other cookie name is stripped, so login appears to do nothing after submit.
const SESSION_COOKIE = process.env.AUTH_COOKIE_NAME || "__session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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

function stripFixturePassword(user: (typeof userFixtures)[number]): User {
  const { password: _pw, ...rest } = user;
  return rest;
}

async function verifyCredentialsPostgres(
  email: string,
  password: string,
): Promise<User | null> {
  const db = getDb();
  const all = await db
    .select({
      user: usersTable,
      deptName: departmentsTable.name,
    })
    .from(usersTable)
    .leftJoin(
      departmentsTable,
      eq(usersTable.departmentId, departmentsTable.id),
    );
  const row = all.find(
    (r) => r.user.email.toLowerCase() === email.toLowerCase(),
  );
  if (!row || row.user.status !== "active" || !row.user.passwordHash) {
    return null;
  }
  const ok = bcrypt.compareSync(password, row.user.passwordHash);
  if (!ok) return null;
  const data = (row.user.data ?? {}) as Record<string, unknown>;
  return {
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    role: row.user.role as User["role"],
    type: row.user.type as User["type"],
    department:
      row.deptName ||
      (typeof data.department === "string" ? data.department : ""),
    department_id: row.user.departmentId ?? undefined,
    bio: typeof data.bio === "string" ? data.bio : "",
    status: row.user.status as User["status"],
    data,
  };
}

export function verifyCredentials(email: string, password: string): User | null {
  // Sync fixture path (default).
  if (isPostgresDataSource()) {
    // Login route is async-capable via Promise — keep sync API for fixture,
    // and expose async helper for postgres callers.
    throw new Error(
      "verifyCredentials is fixture-only; use verifyCredentialsAsync when DATA_SOURCE=postgres",
    );
  }
  const user = userFixtures.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!user || user.status !== "active") return null;
  return stripFixturePassword(user);
}

export async function verifyCredentialsAsync(
  email: string,
  password: string,
): Promise<User | null> {
  if (isPostgresDataSource()) {
    return verifyCredentialsPostgres(email, password);
  }
  return verifyCredentials(email, password);
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

function cookieFlags(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function createSessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; ${cookieFlags()}`;
}

export function createClearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function isAdmin(session: Session | null): boolean {
  return session?.role === "admin";
}

export function isAuthenticated(session: Session | null): boolean {
  return session !== null;
}
