import assert from "node:assert/strict";
import test from "node:test";
import { applyRowCalculations } from "./calculated-fields";

// Transaction BOM line (1.0.15): unit price and line total follow the
// calculation until typed; line cost and variance are formulas.
const line = [
  { api_name: "line_unit_price", data_type: "number", default_formula: "line_unit_cost * (1 + line_markup_pct / 100)" },
  { api_name: "line_total", data_type: "number", default_formula: "line_quantity * line_unit_price" },
  { api_name: "line_cost", data_type: "formula", formula: "line_quantity * line_unit_cost" },
  { api_name: "line_actual_cost", data_type: "number", default_formula: "line_cost" },
  { api_name: "line_variance", data_type: "formula", formula: "line_actual_cost - line_cost" },
];

test("a new line is worked out from cost and markup", () => {
  const out = applyRowCalculations(line, { line_quantity: "3", line_unit_cost: "20", line_markup_pct: "25" });
  assert.equal(out.line_unit_price, "25");
  assert.equal(out.line_total, "75");
  assert.equal(out.line_cost, "60");
  assert.equal(out.line_actual_cost, "60");
  assert.equal(out.line_variance, "0");
});

test("changing the markup moves a following price; a typed price stays", () => {
  const saved = applyRowCalculations(line, { line_quantity: "3", line_unit_cost: "20", line_markup_pct: "25" });
  const remarked = applyRowCalculations(line, { ...saved, line_markup_pct: "50" }, saved);
  assert.equal(remarked.line_unit_price, "30");
  assert.equal(remarked.line_total, "90");
  const typed = applyRowCalculations(line, { ...saved, line_unit_price: "29.99" }, saved);
  assert.equal(typed.line_unit_price, "29.99");
  assert.equal(typed.line_total, "89.97", "the total follows the typed price");
  const later = applyRowCalculations(line, { ...typed, line_markup_pct: "10" }, typed);
  assert.equal(later.line_unit_price, "29.99", "typed price is kept when the markup changes");
});

test("actual cost follows the estimate until the real bill amount is typed", () => {
  const saved = applyRowCalculations(line, { line_quantity: "2", line_unit_cost: "10" });
  assert.equal(saved.line_actual_cost, "20");
  const billed = applyRowCalculations(line, { ...saved, line_actual_cost: "23.5" }, saved);
  assert.equal(billed.line_variance, "3.5");
  const recosted = applyRowCalculations(line, { ...billed, line_unit_cost: "12" }, billed);
  assert.equal(recosted.line_actual_cost, "23.5", "typed actual cost stays");
  assert.equal(recosted.line_variance, "-0.5");
});

test("a typed-only price (no cost) is never overwritten", () => {
  const out = applyRowCalculations(line, { line_quantity: "4", line_unit_price: "50" }, { line_quantity: "4", line_unit_price: "50" });
  assert.equal(out.line_unit_price, "50");
  assert.equal(out.line_total, "200");
});

test("clearing a typed value makes it follow again", () => {
  const typed = { line_quantity: "1", line_unit_cost: "10", line_markup_pct: "0", line_unit_price: "99" };
  const cleared = applyRowCalculations(line, { ...typed, line_unit_price: "" }, typed);
  assert.equal(cleared.line_unit_price, "10");
});
