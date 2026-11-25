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

test("1.0.20: is one of (comma-separated, any field), on or after, before", () => {
  const rec = { id: "r-7", name: "Visits", status: "active", data: { updated_at: "2026-11-20T10:00:00Z", c_region: "Texas", count: "12" } };
  const m = (json: string) => recordMatchesFilter(rec, parsePairingFilter(json));
  assert.equal(m('[{"field":"id","op":"in","value":"r-1, r-7 ,r-9"}]'), true);
  assert.equal(m('[{"field":"id","op":"in","value":"r-1,r-9"}]'), false);
  assert.equal(m('[{"field":"c_region","op":"in","value":"ohio, texas"}]'), true);
  assert.equal(m('[{"field":"updated_at","op":"gte","value":"2026-11-20"}]'), true);
  assert.equal(m('[{"field":"updated_at","op":"lt","value":"2026-11-20"}]'), false);
  assert.equal(m('[{"field":"count","op":"gte","value":"9"}]'), true, "numbers compare as numbers, not text");
  assert.equal(m('[{"field":"missing","op":"gte","value":"2026-01-01"}]'), false, "an empty value never passes a date bound");
  assert.equal(m('[{"field":"status","value":"active"},{"field":"updated_at","op":"gte","value":"2026-11-01"}]'), true);
});

test("1.0.20: a filter reads as text in listings", async () => {
  const { describeFilter } = await import("./pairing-filter");
  assert.equal(describeFilter(""), "Every record");
  assert.equal(describeFilter('[{"field":"id","op":"in","value":"a,b"},{"field":"status","value":"active"}]'), "ID is one of a, b · status equals active");
  assert.equal(describeFilter('[{"field":"updated_at","op":"gte","value":"2026-11-01"}]'), "Last modified is on or after 2026-11-01");
});
