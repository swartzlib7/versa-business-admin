import assert from "node:assert/strict";
import test from "node:test";
(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
const load = () => import("./known-fields");

const T = "treasury_transaction";

test("a field the type does not have is refused, with the nearest real one", async () => {
  const { checkKnownFields } = await load();
  const result = checkKnownFields({ object: T, label: "Transactions", data: { amount: "5", amout: "3" } });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.deepEqual(result.unknown, ["amout"]);
  assert.match(result.message, /Transactions has no field "amout" \(did you mean "amount"\?\)/);
  assert.match(result.message, /Its fields: .*document_kind/);
  assert.match(result.message, /Nothing was saved/);
});

test("system keys, hidden fields and empty unknown values pass; empty unknown values are dropped", async () => {
  const { checkKnownFields } = await load();
  const tx = checkKnownFields({ object: T, label: "Transactions", data: { amount: "5", created_at: "x", last_modified_by: "u", external_id: "", colour: "" } });
  assert.equal(tx.ok, true);
  if (tx.ok) assert.deepEqual(Object.keys(tx.data).sort(), ["amount", "created_at", "external_id", "last_modified_by"]);
  const pairing = checkKnownFields({ object: "driver_pairing", label: "Driver Pairings", data: { target_kind: "header", record_mode: "single", page_size: "5" } });
  assert.equal(pairing.ok, true, "hidden fields are known");
});

test("a key the record already holds passes unchanged and is refused when changed", async () => {
  const { checkKnownFields } = await load();
  const baseline = { name: "Copy", legacy_flag: "on" };
  assert.equal(checkKnownFields({ object: "statistics", label: "Statistics", data: { name: "Copy", legacy_flag: "on" }, baseline }).ok, true);
  const changed = checkKnownFields({ object: "statistics", label: "Statistics", data: { name: "Copy", legacy_flag: "off" }, baseline });
  assert.equal(changed.ok, false);
  assert.equal(checkKnownFields({ object: "statistics", label: "Statistics", data: { legacy_flag: "on" }, baseline: null }).ok, false, "a new record has no stored keys");
});

test("lines are checked by line id", async () => {
  const { checkKnownFields } = await load();
  const baselineLines = [{ id: "l1", data: { line_quantity: "1", legacy_note: "kept" } }];
  const ok = checkKnownFields({
    object: T,
    label: "Transactions",
    data: { amount: "5" },
    lines: [{ id: "l1", data: { line_quantity: "2", legacy_note: "kept" } }, { data: { line_quantity: "3" } }],
    baselineLines,
  });
  assert.equal(ok.ok, true);
  const bad = checkKnownFields({ object: T, label: "Transactions", data: { amount: "5" }, lines: [{ data: { line_qty: "3" } }], baselineLines });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.message, /Transactions lines have no field "line_qty" \(did you mean "line_quantity"\?\)\. Line fields: .*line_unit_price/);
});

test("a field beside data is refused with where to put it; route keys are not", async () => {
  const { recordTopLevelProblem, RECORD_BODY_KEYS, checkOrganizationBody } = await load();
  const problem = recordTopLevelProblem(T, { type_api_name: T, name: "x", amount: "5", data: {} }, RECORD_BODY_KEYS.create);
  assert.match(String(problem), /"amount" is a field of Transactions: send it inside "data"/);
  assert.equal(recordTopLevelProblem(T, { name: "x", status: "draft", data: {}, whatever: 1 }, RECORD_BODY_KEYS.update), null);

  const outside = checkOrganizationBody({ name: "Acme", phone: "555" }, null);
  assert.equal(outside.ok, false);
  if (!outside.ok) assert.equal(outside.code, "FIELD_OUTSIDE_DATA");
  const unknown = checkOrganizationBody({ name: "Acme", data: { phone: "555", fax: "556" } }, null);
  assert.equal(unknown.ok, false);
  if (!unknown.ok) assert.match(unknown.message, /Organizations has no field "fax"/);
  const fine = checkOrganizationBody({ name: "Acme", data: { phone: "555", is_active: true } }, { legacy: "x" });
  assert.equal(fine.ok, true);
  if (fine.ok) assert.deepEqual(fine.data, { phone: "555", is_active: true }, "values keep their own type");
});
