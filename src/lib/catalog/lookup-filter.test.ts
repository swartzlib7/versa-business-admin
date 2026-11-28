import assert from "node:assert/strict";
import test from "node:test";
import { cleanLookupFilter, dependsOnLabel, lookupFilterWant, lookupRowMatches } from "./lookup-filter";

test("a stored filter is trimmed; from_field wins over value; no field means no filter", () => {
  assert.deepEqual(cleanLookupFilter({ field: " org_type ", value: "vendor" }), { field: "org_type", value: "vendor" });
  assert.deepEqual(cleanLookupFilter({ field: "organization_id", value: "x", from_field: " customer_org_id " }), {
    field: "organization_id",
    value: "",
    from_field: "customer_org_id",
  });
  assert.equal(cleanLookupFilter({ field: " ", value: "x" }), null);
  assert.equal(cleanLookupFilter(null), null);
});

test("a fixed filter wants its value; a field filter wants this record's value and waits while it is empty", () => {
  assert.deepEqual(lookupFilterWant({ field: "org_type", value: "vendor" }, {}), { want: "vendor", waiting: false });
  const shipTo = { field: "organization_id", value: "", from_field: "customer_org_id" };
  assert.deepEqual(lookupFilterWant(shipTo, { customer_org_id: "org-1" }), { want: "org-1", waiting: false });
  assert.deepEqual(lookupFilterWant(shipTo, { customer_org_id: "" }), { want: "", waiting: true });
  assert.deepEqual(lookupFilterWant(shipTo, null), { want: "", waiting: true });
});

test("rows match on their data or their own columns", () => {
  const shipTo = { field: "organization_id", value: "", from_field: "customer_org_id" };
  assert.equal(lookupRowMatches(shipTo, { id: "l1", data: { organization_id: "org-1" } }, "org-1"), true);
  assert.equal(lookupRowMatches(shipTo, { id: "l2", data: { organization_id: "org-2" } }, "org-1"), false);
  assert.equal(lookupRowMatches({ field: "org_type", value: "vendor" }, { id: "o", org_type: "vendor" }, "vendor"), true);
});

test("the placeholder names the field a filter waits for", () => {
  assert.equal(dependsOnLabel({ field: "organization_id", value: "", from_field: "customer_org_id" }), "Customer");
  assert.equal(dependsOnLabel({ field: "organization_id", value: "", from_field: "counterparty_organization_id" }), "Counterparty");
  assert.equal(dependsOnLabel({ field: "project_id", value: "", from_field: "project" }), "Project");
});
