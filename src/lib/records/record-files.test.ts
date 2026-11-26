import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkRecordFiles } from "./record-files";

// Uploads go to a throwaway folder, never the app's .data (read when a file is looked up).
process.env.VBA_UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "vba-files-test-"));

function stored(name: string, size = 5) {
  const id = crypto.randomUUID();
  const dir = path.join(process.env.VBA_UPLOADS_DIR!, "record-files");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.bin`), "x".repeat(size));
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify({ id, name, mime: "application/pdf", size }));
  return id;
}

test("stored files are kept, rewritten from the stored file", () => {
  const id = stored("contract.pdf", 9);
  const r = checkRecordFiles("Documents & Photos", JSON.stringify([{ id, name: "renamed.exe", mime: "text/html", size: 1 }, { id }]));
  assert.ok(r.ok);
  assert.deepEqual(JSON.parse(r.ok ? r.value : ""), [{ id, name: "contract.pdf", mime: "application/pdf", size: 9 }]);
});

test("empty clears; junk, a missing file and more than 10 are refused", () => {
  assert.deepEqual(checkRecordFiles("Docs", ""), { ok: true, value: "" });
  assert.deepEqual(checkRecordFiles("Docs", "[]"), { ok: true, value: "" });
  assert.equal(checkRecordFiles("Docs", "not json").ok, false);
  assert.equal(checkRecordFiles("Docs", '{"id":"x"}').ok, false);
  const ghost = crypto.randomUUID();
  const missing = checkRecordFiles("Docs", JSON.stringify([{ id: ghost }]));
  assert.ok(!missing.ok && /not stored on this install/.test(missing.message));
  const eleven = Array.from({ length: 11 }, (_, i) => ({ id: stored(`f${i}.pdf`) }));
  const many = checkRecordFiles("Docs", JSON.stringify(eleven));
  assert.ok(!many.ok && /up to 10/.test(many.message));
});

test("an entry the record already had stays even if its file is gone", () => {
  const ghost = { id: crypto.randomUUID(), name: "old.pdf", mime: "application/pdf", size: 3 };
  const keep = stored("new.pdf");
  const r = checkRecordFiles("Docs", JSON.stringify([ghost, { id: keep }]), [ghost]);
  assert.ok(r.ok);
  assert.equal(JSON.parse(r.ok ? r.value : "[]").length, 2);
});
