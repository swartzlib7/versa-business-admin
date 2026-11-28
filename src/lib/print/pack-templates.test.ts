import assert from "node:assert/strict";
import test from "node:test";
(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
import { PRINT_PACK, contentHash, packData } from "./pack-templates";

test("every shipped template names only fields its record type has", async () => {
  const { layoutFieldSets, printTemplateProblem } = await import("./layout-fields");
  assert.deepEqual(PRINT_PACK.map((t) => t.key), ["invoice", "estimate", "quote", "packing-slip"]);
  for (const t of PRINT_PACK) {
    assert.ok(layoutFieldSets(t.target_record_type).header.size > 3, t.key);
    assert.equal(printTemplateProblem(packData(t)), null, t.key);
  }
});

test("the content hash ignores layout spacing and Status, and sees real changes", () => {
  const data = packData(PRINT_PACK[0]);
  const hash = contentHash(data);
  assert.equal(contentHash({ ...data, layout: JSON.stringify(JSON.parse(data.layout)) }), hash, "spacing is not an edit");
  assert.equal(contentHash({ ...data, status: "archived", notes: "ours" }), hash, "status and notes are not content");
  assert.notEqual(contentHash({ ...data, margin_mm: "20" }), hash);
  assert.notEqual(contentHash({ ...data, layout: data.layout.replace("INVOICE", "TAX INVOICE") }), hash);
});
