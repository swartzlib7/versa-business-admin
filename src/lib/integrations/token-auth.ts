/**
 * Token sign-in for machines (1.0.20, state_integrations.md §3.2). Opt-in per route:
 * `getSessionFromRequest` stays cookie-only, so only a route that calls
 * `requireToken` accepts a token, and only for the record types its Integration allows.
 *
 * Called side: the Credential (auth type "Access token") keeps the token's hash in
 * its encrypted Configuration; the Integration that names the Credential, active and
 * on the called side (receive + push, or send + pull), lists the record types in its
 * lines, each with a filter.
 */
import { NextResponse } from "next/server";
import type { Session } from "@/lib/data/types";
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { parsePairingFilter, recordMatchesFilter } from "@/lib/public/pairing-filter";
import { readRecordSecret } from "@/lib/secrets/read-secret";
import { bearerToken, FailureLimit, makeToken, tokenCredentialId, tokenMatches } from "./token-format";

const LIMIT_KEY = "__vbaTokenFailures__";
const TOUCH_KEY = "__vbaTokenTouched__";

function failures(): FailureLimit {
  const g = globalThis as Record<string, unknown>;
  return (g[LIMIT_KEY] ??= new FailureLimit()) as FailureLimit;
}

/**
 * The caller's address for the failed-attempt limit. X-Real-IP first (nginx sets it
 * from the connection), then the LAST X-Forwarded-For entry (the one the nearest proxy
 * added). Never the first entry: a caller can write that one, and change it per try.
 */
export function callerAddress(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = (request.headers.get("x-forwarded-for") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  return hops[hops.length - 1] || "local";
}

export type IntegrationLine = { id?: string; data: Record<string, string> };

export type TokenGrant = {
  session: Session;
  credential: RecordInstance;
  integration: RecordInstance;
  line: IntegrationLine;
};

export type TokenCheck = { ok: true; grant: TokenGrant } | { ok: false; response: NextResponse };

function refuse(status: number, code: string, message: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error: { code, message } }, { status }) };
}

/** The line of an Integration for a record type, when it is switched on. */
export function lineFor(integration: RecordInstance, recordType: string): IntegrationLine | null {
  const lines = integration.lines ?? [];
  return (
    lines.find(
      (line) =>
        String(line.data?.flow_record_type ?? "").trim() === recordType &&
        String(line.data?.flow_enabled ?? "true") !== "false",
    ) ?? null
  );
}

/** True when this Integration is the side that is called (it issued the token). */
export function isCalledSide(integration: RecordInstance): boolean {
  const direction = String(integration.data?.direction ?? "");
  const mode = String(integration.data?.mode ?? "push");
  return (direction === "receive" && mode === "push") || (direction === "send" && mode === "pull");
}

type StoredToken = { token_hash?: string; expires_at?: string };

export type TokenIdentity = { session: Session; credential: RecordInstance; integrations: RecordInstance[] };

/**
 * Check `Authorization: Bearer vba_…`: a good, active token whose Credential has a
 * system account and at least one active Integration on the called side. 401 for a
 * missing, wrong, revoked or expired token; 403 with no such Integration; 429 after
 * repeated failures from one address.
 */
export async function authenticateToken(
  request: Request,
): Promise<{ ok: true; identity: TokenIdentity } | { ok: false; response: NextResponse }> {
  const address = callerAddress(request);
  const limit = failures();
  if (limit.blocked(address)) {
    return refuse(429, "TOO_MANY_ATTEMPTS", "Too many failed token attempts from this address. Wait a minute.");
  }
  const fail = (code: string, message: string) => {
    if (limit.fail(address)) console.warn(`Access tokens: ${address} blocked for a minute after repeated failures.`);
    limit.sweep();
    return refuse(401, code, message);
  };

  const token = bearerToken(request.headers.get("authorization"));
  const credentialId = tokenCredentialId(token);
  if (!token || !credentialId) return fail("UNAUTHORIZED", "An access token is required (Authorization: Bearer vba_…).");

  const { adapter } = await import("@/lib/data/adapter");
  const credential = adapter.getRecord ? await adapter.getRecord(credentialId).catch(() => null) : null;
  if (!credential || credential.type_api_name !== "vendor_credential") return fail("UNAUTHORIZED", "Unknown access token.");
  if (String(credential.data?.auth_type ?? "") !== "token" || credential.status !== "active") {
    return fail("UNAUTHORIZED", "This access token is not active.");
  }
  let stored: StoredToken = {};
  try {
    stored = JSON.parse((await readRecordSecret(credentialId, "configuration")) ?? "{}") as StoredToken;
  } catch {
    stored = {};
  }
  if (!stored.token_hash || !tokenMatches(token, stored.token_hash)) return fail("UNAUTHORIZED", "Unknown access token.");
  if (stored.expires_at && Date.parse(stored.expires_at) <= Date.now()) return fail("UNAUTHORIZED", "This access token has expired.");

  const systemUserId = String(credential.data?.system_user_id ?? "");
  if (!systemUserId) return fail("UNAUTHORIZED", "This access token has no system account. Issue it again.");

  const all = adapter.listRecords ? await adapter.listRecords({ type_api_name: "vendor_integration" }) : [];
  const integrations = all.filter(
    (row) => String(row.data?.credential_id ?? "") === credentialId && row.status === "active" && isCalledSide(row),
  );
  if (!integrations.length) return refuse(403, "FORBIDDEN", "No active Integration uses this access token.");
  touchLastUsed(credentialId);
  return {
    ok: true,
    identity: {
      session: { userId: systemUserId, name: credential.name, email: "", role: "member", type: "system" },
      credential,
      integrations,
    },
  };
}

/**
 * A token for one record type (and, when given, one record, which must pass the
 * line's filter): 403 when the token is good but not for this type or record.
 */
export async function requireToken(
  request: Request,
  opts: { recordType: string; record?: RecordInstance | null },
): Promise<TokenCheck> {
  const auth = await authenticateToken(request);
  if (!auth.ok) return auth;
  const match = auth.identity.integrations
    .map((integration) => ({ integration, line: lineFor(integration, opts.recordType) }))
    .find((m) => m.line);
  if (!match?.line) return refuse(403, "FORBIDDEN", `This access token is not allowed for ${opts.recordType}.`);
  if (opts.record && !recordMatchesFilter(opts.record, parsePairingFilter(match.line.data.flow_filter))) {
    return refuse(403, "FORBIDDEN", "This record is outside what the Integration allows.");
  }
  return {
    ok: true,
    grant: { session: auth.identity.session, credential: auth.identity.credential, integration: match.integration, line: match.line },
  };
}

/** Last used, written at most once a minute per credential, never blocking the request. */
function touchLastUsed(credentialId: string): void {
  const g = globalThis as Record<string, unknown>;
  const seen = (g[TOUCH_KEY] ??= new Map<string, number>()) as Map<string, number>;
  const now = Date.now();
  if (now - (seen.get(credentialId) ?? 0) < 60_000) return;
  seen.set(credentialId, now);
  void import("@/lib/db/data-source")
    .then(async ({ isPostgresDataSource }) => {
      if (!isPostgresDataSource()) return;
      const { touchRecordFieldDb } = await import("@/lib/db/records-store");
      await touchRecordFieldDb(credentialId, "last_used_at", new Date(now).toISOString());
    })
    .catch(() => undefined);
}

/**
 * Issue a new token on an Access-token Credential (admin action). Replaces any
 * earlier token at once. Creates the Credential's system account the first time.
 * The token is returned once and never stored.
 */
export async function issueToken(
  credentialId: string,
): Promise<{ ok: true; token: string; hint: string; systemUserId: string } | { ok: false; status: number; message: string }> {
  const { adapter } = await import("@/lib/data/adapter");
  if (!adapter.getRecord || !adapter.updateRecord || !adapter.createUser) return { ok: false, status: 501, message: "Not available." };
  const credential = await adapter.getRecord(credentialId).catch(() => null);
  if (!credential || credential.type_api_name !== "vendor_credential") {
    return { ok: false, status: 404, message: "Credential not found." };
  }
  const authType = String(credential.data?.auth_type ?? "");
  if (authType && authType !== "token") {
    return { ok: false, status: 400, message: `This Credential's Auth type is ${authType}. Tokens are issued on an "Access token" Credential.` };
  }

  let systemUserId = String(credential.data?.system_user_id ?? "");
  const users = await adapter.listUsers("system").catch(() => []);
  if (!systemUserId || !users.some((u) => u.id === systemUserId)) {
    const user = await adapter.createUser!({
      name: `${credential.name} (integration)`,
      email: `integration-${credentialId}@system.invalid`,
      role: "member",
      type: "system",
      status: "active",
      data: { credential_id: credentialId },
    } as never);
    systemUserId = user.id;
  }

  const issued = makeToken(credentialId);
  const configuration = JSON.stringify({
    token_hash: issued.hash,
    token_hint: issued.hint,
    issued_at: new Date().toISOString(),
    expires_at: "",
  });
  const result = await adapter.updateRecord(credentialId, {
    data: { ...credential.data, auth_type: "token", configuration, system_user_id: systemUserId },
  });
  if (!result.ok) return { ok: false, status: 400, message: result.message };
  return { ok: true, token: issued.token, hint: issued.hint, systemUserId };
}
