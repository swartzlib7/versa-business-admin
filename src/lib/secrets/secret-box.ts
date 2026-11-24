/**
 * Encryption at rest for secret fields (1.0.18 security fix,
 * state_integrations.md §3.4).
 *
 * A stored secret is `enc:v1:<iv>.<tag>.<ciphertext>` (base64url), AES-256-GCM
 * with this install's data key. A value without the prefix is plain text from
 * before 1.0.18; it is still read, and the first start encrypts it.
 *
 * Key: `VBA_DATA_KEY` (64 hexadecimal characters) when set, otherwise
 * `.data/data-key`, created on first use and readable only by the app user.
 * Losing the key makes stored secrets unreadable (re-enter them); nothing
 * else depends on it. Backups do not carry `.data/data-key`: keep a copy apart.
 *
 * Node runtime only.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PREFIX = "enc:v1:";
const KEY_PATH = path.join(process.cwd(), ".data", "data-key");
let cached: Buffer | null = null;

function parseHexKey(hex: string, source: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`${source} must be 64 hexadecimal characters (32 bytes).`);
  }
  return Buffer.from(hex, "hex");
}

function dataKey(): Buffer {
  const fromEnv = process.env.VBA_DATA_KEY?.trim();
  if (fromEnv) return parseHexKey(fromEnv, "VBA_DATA_KEY");
  if (cached) return cached;
  try {
    const existing = fs.readFileSync(KEY_PATH, "utf8").trim();
    if (existing) return (cached = parseHexKey(existing, KEY_PATH));
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
  }
  const next = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(KEY_PATH), { recursive: true });
  try {
    // Exclusive create: two processes starting together end up with the first one's key.
    fs.writeFileSync(KEY_PATH, next, { flag: "wx", mode: 0o600 });
    return (cached = Buffer.from(next, "hex"));
  } catch {
    return (cached = parseHexKey(fs.readFileSync(KEY_PATH, "utf8").trim(), KEY_PATH));
  }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypt a plain value. An empty value stays empty; an encrypted one is returned as it is. */
export function encryptSecret(plain: string): string {
  if (!plain || isEncrypted(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${body.toString("base64url")}`;
}

/** The plain value; plain text from before 1.0.18 as it is; null when it cannot be decrypted (other key, damaged). */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  if (!isEncrypted(stored)) return stored;
  const parts = stored.slice(PREFIX.length).split(".");
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, body] = parts.map((p) => Buffer.from(p, "base64url"));
    const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
