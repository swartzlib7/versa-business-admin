import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_ONLY_FILTER_JSON, parsePairingFilter, recordMatchesFilter, selectPairedRecords } from "./pairing-filter";

const rows = [
  { id: "a", name: "Board rollout", status: "active", data: { external_id: "ba_sample:project:rollout" } },
  { id: "b", name: "My test project", status: "active", data: { external_id: "" } },
  { id: "c", name: "Wave import", status: "done", data: { external_id: "wave:123" } },
];

test("sample-only filter keeps sample records", () => {
  const picked = selectPairedRecords(rows, { selection_mode: "filter", filter_json: SAMPLE_ONLY_FILTER_JSON });
  assert.deepEqual(picked.map((r) => r.id), ["a"]);
});

test("one, all, and an empty filter", () => {
  assert.deepEqual(selectPairedRecords(rows, { selection_mode: "one", target_record_id: "b" }).map((r) => r.id), ["b"]);
  assert.equal(selectPairedRecords(rows, { selection_mode: "all" }).length, 3);
  assert.equal(selectPairedRecords(rows, { selection_mode: "filter", filter_json: "" }).length, 3);
  assert.equal(selectPairedRecords(rows, { selection_mode: "filter", filter_json: "not json" }).length, 3);
});

test("ops and record-level fields", () => {
  const conds = parsePairingFilter('[{"field":"status","value":"DONE"},{"field":"name","op":"contains","value":"wave"}]');
  assert.equal(recordMatchesFilter(rows[2], conds), true);
  assert.equal(recordMatchesFilter(rows[0], conds), false);
  assert.equal(recordMatchesFilter(rows[1], parsePairingFilter('{"field":"external_id","op":"empty"}')), true);
  assert.equal(recordMatchesFilter(rows[1], parsePairingFilter('{"field":"external_id","op":"bogus","value":""}')), true);
});
