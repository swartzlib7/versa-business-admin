import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerToken, FailureLimit, makeToken, tokenCredentialId, tokenMatches } from "./token-format";

test("a token carries its credential id and matches only its own hash", () => {
  const id = "6409a206-fd52-4c6a-b9a8-6e502aed6e97";
  const issued = makeToken(id);
  assert.match(issued.token, /^vba_6409a206-fd52-4c6a-b9a8-6e502aed6e97_[A-Za-z0-9_-]{43}$/);
  assert.equal(tokenCredentialId(issued.token), id);
  assert.equal(tokenMatches(issued.token, issued.hash), true);
  assert.equal(tokenMatches(makeToken(id).token, issued.hash), false);
  assert.doesNotMatch(issued.hint, new RegExp(issued.token.slice(-20)));
});

test("ids with underscores still parse; junk does not", () => {
  const issued = makeToken("cred_with_underscores");
  assert.equal(tokenCredentialId(issued.token), "cred_with_underscores");
  for (const bad of ["", "vba_", "vba_x_short", "Bearer vba_abc", "abc_" + "a".repeat(43), "vba_id_" + "!".repeat(43)]) {
    assert.equal(tokenCredentialId(bad), null, bad);
  }
});

test("bearer header", () => {
  assert.equal(bearerToken("Bearer abc"), "abc");
  assert.equal(bearerToken("bearer  abc "), "abc");
  assert.equal(bearerToken("Basic abc"), null);
  assert.equal(bearerToken(null), null);
});

test("ten failures in a minute block the address for a minute", () => {
  const limit = new FailureLimit(10, 60_000);
  const t0 = 1_000_000;
  for (let i = 0; i < 9; i++) assert.equal(limit.fail("1.2.3.4", t0 + i), false);
  assert.equal(limit.blocked("1.2.3.4", t0 + 10), false);
  assert.equal(limit.fail("1.2.3.4", t0 + 10), true);
  assert.equal(limit.blocked("1.2.3.4", t0 + 11), true);
  assert.equal(limit.blocked("5.6.7.8", t0 + 11), false);
  assert.equal(limit.blocked("1.2.3.4", t0 + 60_011), false);
});

test("the limit keys on the address the nearest proxy saw, not one the caller wrote", async () => {
  const { callerAddress } = await import("./token-auth");
  const req = (h: Record<string, string>) => new Request("http://x/", { headers: h });
  assert.equal(callerAddress(req({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" })), "1.2.3.4");
  assert.equal(callerAddress(req({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "6.6.6.6" })), "1.2.3.4");
  assert.equal(callerAddress(req({})), "local");
});
