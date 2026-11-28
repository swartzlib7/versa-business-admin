import assert from "node:assert/strict";
import test from "node:test";
import { cleanAutoNumber, nextAutoNumber } from "./auto-number";

test("the setting is trimmed, digits default to 4 and stay within 1-12; nothing set means off", () => {
  assert.deepEqual(cleanAutoNumber({ prefix: " SH- ", digits: "5" }), { prefix: "SH-", digits: 5 });
  assert.deepEqual(cleanAutoNumber({ prefix: "INV" }), { prefix: "INV", digits: 4 });
  assert.deepEqual(cleanAutoNumber({ prefix: "", digits: 40 }), { prefix: "", digits: 12 });
  assert.equal(cleanAutoNumber(null), null);
  assert.equal(cleanAutoNumber(""), null);
});

test("the next number follows the highest one used with that prefix", () => {
  const rule = { prefix: "SH-", digits: 4 };
  assert.equal(nextAutoNumber(rule, []), "SH-0001");
  assert.equal(nextAutoNumber(rule, ["SH-0001", "SH-0007", "SH-0003", "", undefined]), "SH-0008");
  assert.equal(nextAutoNumber(rule, ["sh-0012"]), "SH-0013", "case does not matter");
  assert.equal(nextAutoNumber(rule, ["Box 99", "SH-12a", "INV-0400"]), "SH-0001", "other values are ignored");
  assert.equal(nextAutoNumber(rule, ["SH-9999"]), "SH-10000", "it grows past its digits");
  assert.equal(nextAutoNumber({ prefix: "A.1(", digits: 2 }, ["A.1(05"]), "A.1(06", "a prefix with special characters");
});
