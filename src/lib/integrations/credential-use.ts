/**
 * Using a Credential from a script (1.0.20, state_integrations.md §3.10).
 *
 * A Credential's Users lines name the people and agents who may use it. One of them,
 * signed in with their own account (a script signs in as its agent: sign-in.md), asks
 * `GET /api/credentials/<id>/secret` and gets the plain Configuration. Anyone else gets 403 and is told to ask the
 * Primary User to be added. Screens and the records API still show `••••••` to
 * everyone; an admin who wants to use a Credential adds themselves to its list,
 * which the record's history shows.
 */
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import { readRecordSecret } from "@/lib/secrets/read-secret";

/** The line field that names a user on a Credential's Users list. */
export const CREDENTIAL_USER_FIELD = "user_id";

/** The Users line for this user, or null when they are not on the list. */
export function credentialUserLine(credential: RecordInstance, userId: string): { id?: string } | null {
  if (!userId) return null;
  return (credential.lines ?? []).find((line) => String(line.data?.[CREDENTIAL_USER_FIELD] ?? "").trim() === userId) ?? null;
}

function refuse(status: number, code: string, message: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error: { code, message } }, { status }) };
}

export type CredentialOpened =
  | { ok: true; credential: RecordInstance; configuration: string; userName: string }
  | { ok: false; response: NextResponse };

/**
 * The session's user must be an active person or agent, on the Users list of an
 * active Credential. Records the use on the Users line and the Credential.
 */
export async function openCredential(request: Request, credentialId: string): Promise<CredentialOpened> {
  const userId = getSessionFromRequest(request)?.userId ?? "";
  if (!userId) return refuse(401, "UNAUTHORIZED", "Sign in first. A script signs in as its agent (docs/agents/sign-in.md).");

  const { adapter } = await import("@/lib/data/adapter");
  const user = await adapter.getUser(userId).catch(() => null);
  if (!user || (user.type !== "human" && user.type !== "agent") || String(user.status ?? "active") !== "active") {
    return refuse(403, "FORBIDDEN", "Only an active person or agent can use a Credential.");
  }
  const credential = adapter.getRecord ? await adapter.getRecord(credentialId).catch(() => null) : null;
  if (!credential || credential.type_api_name !== "vendor_credential") return refuse(404, "NOT_FOUND", "Credential not found.");

  const line = credentialUserLine(credential, userId);
  if (!line) {
    return refuse(
      403,
      "NOT_ON_USERS_LIST",
      `${user.name} is not on the Users list of the Credential "${credential.name}". Ask the Primary User to add you ` +
        `(Collaboration → Vendor → Credentials → ${credential.name} → Users).`,
    );
  }
  if (credential.status !== "active") return refuse(403, "FORBIDDEN", `The Credential "${credential.name}" is not active.`);

  const configuration = (await readRecordSecret(credential.id, "configuration").catch(() => null)) ?? "";
  if (/"token_hash"\s*:/.test(configuration)) {
    return refuse(
      400,
      "NOTHING_TO_USE",
      `"${credential.name}" keeps only the fingerprint of a token this install issued. There is no secret in it to use.`,
    );
  }

  const now = new Date().toISOString();
  void import("@/lib/db/data-source")
    .then(async ({ isPostgresDataSource }) => {
      if (!isPostgresDataSource()) return;
      const { touchLineFieldDb, touchRecordFieldDb } = await import("@/lib/db/records-store");
      if (line.id) await touchLineFieldDb(line.id, "user_last_used_at", now);
      await touchRecordFieldDb(credential.id, "last_used_at", now);
    })
    .catch(() => undefined);
  console.info(`Credentials: "${credential.name}" used by ${user.name} (${user.type}).`);
  return { ok: true, credential, configuration, userName: user.name };
}
