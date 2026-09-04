/**
 * Proof-of-work login challenge. No third-party captcha service —
 * suitable for LAN and self-hosted remote installs.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const LOGIN_CHALLENGE_DIFFICULTY = 4;
const TTL_MS = 5 * 60 * 1000;
const SECRET_PATH = path.join(process.cwd(), ".data", "challenge-secret");

export type LoginChallenge = {
  nonce: string;
  issued: number;
  difficulty: number;
  sig: string;
};

function secret(): string {
  try {
    const existing = fs.readFileSync(SECRET_PATH, "utf8").trim();
    if (existing) return existing;
  } catch {
    /* create below */
  }
  const next = crypto.randomBytes(32).toString("hex");
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, next);
  return next;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function issueLoginChallenge(): LoginChallenge {
  const nonce = crypto.randomBytes(16).toString("hex");
  const issued = Date.now();
  const difficulty = LOGIN_CHALLENGE_DIFFICULTY;
  const sig = sign(`${nonce}:${issued}:${difficulty}`);
  return { nonce, issued, difficulty, sig };
}

export function verifyLoginChallenge(input: {
  nonce?: unknown;
  issued?: unknown;
  difficulty?: unknown;
  sig?: unknown;
  solution?: unknown;
}): boolean {
  if (
    typeof input.nonce !== "string" ||
    typeof input.issued !== "number" ||
    typeof input.difficulty !== "number" ||
    typeof input.sig !== "string" ||
    typeof input.solution !== "number"
  ) {
    return false;
  }
  if (input.difficulty !== LOGIN_CHALLENGE_DIFFICULTY) return false;
  if (Date.now() - input.issued > TTL_MS || input.issued > Date.now() + 5000) return false;
  const expected = sign(`${input.nonce}:${input.issued}:${input.difficulty}`);
  const sigBuf = Buffer.from(input.sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  const hash = crypto.createHash("sha256").update(`${input.nonce}:${input.solution}`).digest("hex");
  return hash.startsWith("0".repeat(input.difficulty));
}
