import { test } from "node:test";
import assert from "node:assert/strict";

import { signSessionToken, verifySessionToken } from "./session-token";

// The secret is read on every call, so setting it here applies to every test.
process.env.VBA_SESSION_SECRET = "test-secret-one";

const session = { userId: "u1", name: "Staff", email: "s@example.com", role: "member", type: "human" };

test("a signed token round-trips", () => {
  assert.deepEqual(verifySessionToken(signSessionToken(session, 3600)), session);
});

test("the old unsigned cookie and a forged admin cookie are rejected", () => {
  const forged = Buffer.from(JSON.stringify({ ...session, role: "admin" })).toString("base64");
  assert.equal(verifySessionToken(forged), null);
  assert.equal(verifySessionToken(`${forged}.not-a-signature`), null);
});

test("changing the payload breaks the signature", () => {
  const token = signSessionToken(session, 3600);
  const [, sig] = token.split(".");
  const admin = Buffer.from(JSON.stringify({ s: { ...session, role: "admin" }, exp: 9999999999 })).toString("base64url");
  assert.equal(verifySessionToken(`${admin}.${sig}`), null);
});

test("expired tokens and tokens from another secret are rejected", () => {
  const now = Date.now();
  assert.equal(verifySessionToken(signSessionToken(session, 60, now - 120_000), now), null);
  const token = signSessionToken(session, 3600);
  process.env.VBA_SESSION_SECRET = "a-different-secret";
  assert.equal(verifySessionToken(token), null);
  process.env.VBA_SESSION_SECRET = "test-secret-one";
});

test("empty and malformed input", () => {
  for (const bad of [undefined, null, "", ".", "abc", "abc.", ".abc"]) assert.equal(verifySessionToken(bad), null);
});
