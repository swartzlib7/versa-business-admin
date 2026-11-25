/**
 * Access tokens (1.0.20, state_integrations.md §3.2). Pure functions, unit-tested.
 *
 * A token is `vba_<credential id>_<43 characters>`: 32 random bytes in base64url.
 * The id says which Credential to check (no search), and the prefix makes a token
 * that leaks into a log easy to recognise. The called side keeps only the SHA-256
 * hash and a hint (first and last 4 characters of the secret part).
 */
import crypto from "node:crypto";

export const TOKEN_PREFIX = "vba_";
const SECRET_LENGTH = 43; // base64url of 32 bytes, no padding

export type IssuedToken = { token: string; hash: string; hint: string };

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function makeToken(credentialId: string): IssuedToken {
  const secret = crypto.randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${credentialId}_${secret}`;
  return { token, hash: hashToken(token), hint: `${TOKEN_PREFIX}…${secret.slice(-4)}` };
}

/** The credential id inside a token, or null when it is not a VBA token. */
export function tokenCredentialId(raw: string | null | undefined): string | null {
  const token = (raw ?? "").trim();
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const sep = token.length - SECRET_LENGTH - 1;
  if (sep <= TOKEN_PREFIX.length || token[sep] !== "_") return null;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token.slice(sep + 1))) return null;
  const id = token.slice(TOKEN_PREFIX.length, sep);
  return /^[A-Za-z0-9:_-]{1,128}$/.test(id) ? id : null;
}

/** Constant-time comparison of a presented token with a stored hash. */
export function tokenMatches(token: string, storedHash: string): boolean {
  const given = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  return given.length === stored.length && crypto.timingSafeEqual(given, stored);
}

/** `Authorization: Bearer <token>` → the token, else null. */
export function bearerToken(header: string | null | undefined): string | null {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(header ?? "");
  return m ? m[1] : null;
}

/**
 * Failed token attempts per address (1.0.20): 10 in a minute and that address
 * gets 429 for a minute. In memory, per process; enough for one install.
 */
export class FailureLimit {
  private seen = new Map<string, { count: number; since: number; blockedUntil: number }>();
  constructor(private readonly max = 10, private readonly windowMs = 60_000) {}

  blocked(address: string, now = Date.now()): boolean {
    return (this.seen.get(address)?.blockedUntil ?? 0) > now;
  }

  /** Count a failure; true when this one starts a block. */
  fail(address: string, now = Date.now()): boolean {
    const row = this.seen.get(address);
    if (!row || now - row.since > this.windowMs) {
      this.seen.set(address, { count: 1, since: now, blockedUntil: 0 });
      return false;
    }
    row.count += 1;
    if (row.count >= this.max && row.blockedUntil <= now) {
      row.blockedUntil = now + this.windowMs;
      return true;
    }
    return false;
  }

  /** Forget old entries so the map does not grow without end. */
  sweep(now = Date.now()): void {
    for (const [key, row] of this.seen) {
      if (now - row.since > this.windowMs && row.blockedUntil <= now) this.seen.delete(key);
    }
  }
}
