import assert from "node:assert/strict";
import test from "node:test";
(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
import { contentHash, packData, PRINT_PACK } from "./pack-templates";

test("a template's origin: own, shipped while unchanged, edited after a change", async () => {
  const { originOf } = await import("./pack-templates");
  const shipped = { ...packData(PRINT_PACK[3]), shipped_key: "packing-slip", shipped_hash: contentHash(packData(PRINT_PACK[3])) };
  assert.equal(originOf({ ...packData(PRINT_PACK[3]) }), "own");
  assert.equal(originOf(shipped), "shipped");
  assert.equal(originOf({ ...shipped, status: "archived" }), "shipped", "archiving is not an edit");
  assert.equal(originOf({ ...shipped, margin_mm: "20" }), "edited");
});
