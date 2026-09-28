import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { authToken } from "@/lib/db/schema";

export type TokenPurpose = "password_reset" | "email_change";

const TTL_MS: Record<TokenPurpose, number> = {
  password_reset: 60 * 60 * 1000,
  email_change: 24 * 60 * 60 * 1000,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAccountToken(
  userId: string,
  purpose: TokenPurpose,
  payload: Record<string, unknown> = {},
): Promise<string> {
  const db = getDb();
  await db
    .update(authToken)
    .set({ usedAt: new Date() })
    .where(and(eq(authToken.userId, userId), eq(authToken.purpose, purpose), isNull(authToken.usedAt)));
  const token = randomBytes(32).toString("base64url");
  await db.insert(authToken).values({
    userId,
    purpose,
    tokenHash: hashToken(token),
    payload,
    expiresAt: new Date(Date.now() + TTL_MS[purpose]),
  });
  return token;
}

export async function consumeAccountToken(
  token: string,
  purpose: TokenPurpose,
): Promise<{ userId: string; payload: Record<string, unknown> } | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(authToken)
    .where(and(eq(authToken.tokenHash, hashToken(token)), eq(authToken.purpose, purpose), isNull(authToken.usedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  await db.update(authToken).set({ usedAt: new Date() }).where(eq(authToken.id, row.id));
  return { userId: row.userId, payload: (row.payload ?? {}) as Record<string, unknown> };
}
