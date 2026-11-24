/**
 * Signed session tokens (1.0.17 security fix).
 *
 * Before 1.0.17 the session cookie was plain base64 JSON and the server
 * trusted it as written: anyone could write their own cookie with
 * "role":"admin". A token is now `<payload>.<signature>`: the payload is
 * base64url JSON `{ s: <session>, exp: <unix seconds> }`, the signature is
 * HMAC-SHA256 of the payload with this install's secret. A token that is
 * unsigned, altered, signed with another secret, or past `exp` is rejected.
 *
 * Secret: `VBA_SESSION_SECRET` when set, otherwise `.data/session-secret`
 * (created on first use, readable only by the app user). Changing or losing
 * the secret signs everyone out; nothing else depends on it.
 *
 * Node runtime only (route handlers, server components, src/proxy.ts).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SECRET_PATH = path.join(process.cwd(), ".data", "session-secret");
let cached: string | null = null;

function secret(): string {
  const fromEnv = process.env.VBA_SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (cached) return cached;
  try {
    const existing = fs.readFileSync(SECRET_PATH, "utf8").trim();
    if (existing) return (cached = existing);
  } catch {
    /* create below */
  }
  const next = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  try {
    // Exclusive create: when two processes start together, both end up with the first one's secret.
    fs.writeFileSync(SECRET_PATH, next, { flag: "wx", mode: 0o600 });
    return (cached = next);
  } catch {
    return (cached = fs.readFileSync(SECRET_PATH, "utf8").trim());
  }
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Sign `session` for `maxAgeSeconds`. */
export function signSessionToken<T extends object>(session: T, maxAgeSeconds: number, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ s: session, exp: Math.floor(now / 1000) + maxAgeSeconds }),
  ).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

/** The session inside a valid, unexpired token; null for anything else. */
export function verifySessionToken<T extends object>(token: string | undefined | null, now = Date.now()): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = Buffer.from(hmac(payload), "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { s?: T; exp?: number };
    if (!parsed.s || typeof parsed.exp !== "number" || parsed.exp * 1000 <= now) return null;
    return parsed.s;
  } catch {
    return null;
  }
}
