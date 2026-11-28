import assert from "node:assert/strict";
import test from "node:test";
import { numberPattern } from "./record-numbers";

test("the stored-number pattern takes the prefix literally and reads the digits", () => {
  const sh = new RegExp(numberPattern("SH-"), "i");
  assert.equal(sh.exec("SH-0042")?.[1], "0042");
  assert.equal(sh.exec("sh-7")?.[1], "7", "case does not matter");
  assert.equal(sh.exec("SH-12a"), null);
  assert.equal(sh.exec("XSH-12"), null);
  const odd = new RegExp(numberPattern("A.1("), "i");
  assert.equal(odd.exec("A.1(05")?.[1], "05");
  assert.equal(odd.exec("AX1(05"), null, "a dot in the prefix is a dot");
  assert.equal(new RegExp(numberPattern(""), "i").exec("0012")?.[1], "0012");
});
