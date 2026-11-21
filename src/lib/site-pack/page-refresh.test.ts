import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyHash, decidePageRefresh } from "./page-refresh";

test("an untouched old body is replaced, an edited one is kept", () => {
  const old = "<p>old slide</p>";
  const shipped = [bodyHash(old)];
  assert.equal(decidePageRefresh("<p>new slide</p>", "<p>new slide</p>", shipped), "current");
  assert.equal(decidePageRefresh(old, "<p>new slide</p>", shipped), "update");
  assert.equal(decidePageRefresh("<p>old slide, edited</p>", "<p>new slide</p>", shipped), "edited");
});
