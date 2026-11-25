import assert from "node:assert/strict";
import test from "node:test";
import { textValues } from "./text-values";
import { lineDataStrings } from "./line-group";
import { parsePairingFilter, recordMatchesFilter } from "../public/pairing-filter";

const filter = [{ field: "name", op: "starts_with", value: "Texas Boot" }];

test("a JSON list sent as a value is kept as its JSON text", () => {
  const out = textValues({ flow_filter: filter, flow_enabled: true, qty: 7, note: "x", gone: null });
  assert.deepEqual(out, { flow_filter: JSON.stringify(filter), flow_enabled: "true", qty: "7", note: "x" });
});

test("the stored text reads back as the same filter", () => {
  const conditions = parsePairingFilter(textValues({ f: filter }).f);
  assert.deepEqual(conditions, filter);
  assert.equal(recordMatchesFilter({ name: "Texas Boot daily" }, conditions), true);
  assert.equal(recordMatchesFilter({ name: "Other" }, conditions), false);
});

test("the add-lines API no longer turns a list into [object Object]", () => {
  assert.equal(lineDataStrings({ flow_filter: filter })?.flow_filter, JSON.stringify(filter));
  assert.equal(lineDataStrings([filter]), null);
});
