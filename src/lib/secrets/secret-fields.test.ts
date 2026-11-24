import { test } from "node:test";
import assert from "node:assert/strict";

import { decryptSecret, encryptSecret, isEncrypted } from "./secret-box";
import { MASK, maskSecretFields, maskSecretValue, restoreMasked, sealSecretFields } from "./secret-fields";

// The key is read on every call, so setting it here applies to every test.
process.env.VBA_DATA_KEY = "11".repeat(32);

const smtp = JSON.stringify({
  email_address: "office@example.com",
  auth: { type: "basic", username: "office@example.com", password: "s3cret" },
  smtp: { enabled: true, host: "mail.example.com", port: 587 },
  api_key: "abc123",
  token_hint: "vba_ab…yz",
});

test("encrypt and decrypt round-trip; plain text from before 1.0.18 still reads", () => {
  const sealed = encryptSecret("hello");
  assert.ok(isEncrypted(sealed));
  assert.notEqual(sealed, encryptSecret("hello"), "a fresh IV every time");
  assert.equal(decryptSecret(sealed), "hello");
  assert.equal(decryptSecret("plain"), "plain");
  assert.equal(encryptSecret(""), "");
});

test("another key or a damaged value cannot be read", () => {
  const sealed = encryptSecret("hello");
  process.env.VBA_DATA_KEY = "22".repeat(32);
  assert.equal(decryptSecret(sealed), null);
  process.env.VBA_DATA_KEY = "11".repeat(32);
  assert.equal(decryptSecret(sealed.slice(0, -4) + "AAAA"), null);
});

test("a bad VBA_DATA_KEY is refused, not used", () => {
  process.env.VBA_DATA_KEY = "short";
  assert.throws(() => encryptSecret("x"), /64 hexadecimal/);
  process.env.VBA_DATA_KEY = "11".repeat(32);
});

test("JSON keeps its shape; only secret values are masked", () => {
  const masked = JSON.parse(maskSecretValue(smtp));
  assert.equal(masked.auth.password, MASK);
  assert.equal(masked.api_key, MASK);
  assert.equal(masked.auth.username, "office@example.com");
  assert.equal(masked.smtp.host, "mail.example.com");
  assert.equal(masked.token_hint, "vba_ab…yz");
  assert.equal(maskSecretValue("not json"), MASK);
  assert.equal(maskSecretValue(""), "");
});

test("saving the masked form keeps the secret and takes the other edits", () => {
  const masked = JSON.parse(maskSecretValue(smtp));
  masked.smtp.port = 465;
  const restored = JSON.parse(restoreMasked(JSON.stringify(masked), smtp));
  assert.equal(restored.auth.password, "s3cret");
  assert.equal(restored.api_key, "abc123");
  assert.equal(restored.smtp.port, 465);
  assert.equal(restoreMasked(MASK, "whole"), "whole");
  assert.equal(restoreMasked("new value", "old"), "new value");
});

test("seal on write, mask on read, through the record header", () => {
  const created = sealSecretFields("vendor_credential", { name: "Mail", configuration: smtp }, null);
  assert.ok(isEncrypted(created.configuration));
  assert.equal(created.name, "Mail");

  const read = maskSecretFields("vendor_credential", created);
  assert.ok(!read.configuration.includes("s3cret"));
  assert.ok(!read.configuration.includes("abc123"));

  // The form comes back with the masked value: the stored secret stays.
  const updated = sealSecretFields("vendor_credential", { ...read, notes: "x" }, created);
  assert.equal(JSON.parse(decryptSecret(updated.configuration) ?? "{}").auth.password, "s3cret");

  // A clone (no stored value) does not carry the secret.
  const cloned = sealSecretFields("vendor_credential", { ...read }, null);
  assert.equal(JSON.parse(decryptSecret(cloned.configuration) ?? "{}").auth.password, "");

  // Unreadable stored value + whole mask: kept exactly.
  const whole = sealSecretFields("vendor_credential", { configuration: MASK }, { configuration: "enc:v1:broken" });
  assert.equal(whole.configuration, "enc:v1:broken");

  // Other record types are untouched.
  assert.deepEqual(sealSecretFields("page", { body: "<p>password</p>" }, null), { body: "<p>password</p>" });
});

test("a mask sent escaped (Python json.dumps writes \\u2022) still keeps the secret", () => {
  const created = sealSecretFields("vendor_credential", { configuration: smtp }, null);
  const masked = maskSecretFields("vendor_credential", created).configuration;
  const escaped = masked.replace(/[\u2022]/g, "\\u2022");
  assert.ok(!escaped.includes(MASK) && escaped.includes("\\u2022"));
  const saved = sealSecretFields("vendor_credential", { configuration: escaped }, created);
  assert.equal(JSON.parse(decryptSecret(saved.configuration) ?? "{}").auth.password, "s3cret");
});
