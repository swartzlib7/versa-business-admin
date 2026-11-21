import assert from "node:assert/strict";
import test from "node:test";
import { compileFormula, computeFormulaValues, evaluateFormula, orderFormulas, readRow } from "./formula";

const run = (formula: string, row: Record<string, unknown> = {}) => {
  const c = compileFormula(formula);
  assert.ok(c.ok, c.ok ? "" : c.error);
  return evaluateFormula(c.ast, readRow(row));
};

test("arithmetic, precedence and brackets", () => {
  assert.equal(run("2 + 3 * 4"), 14);
  assert.equal(run("(2 + 3) * 4"), 20);
  assert.equal(run("-a + 10", { a: "4" }), 6);
  assert.equal(run("10 / 4"), 2.5);
  assert.equal(run("1 / 0"), null, "division by zero is empty");
});

test("functions: SUM, ROUND, MIN, MAX, IF, FIRST", () => {
  assert.equal(run("SUM(a, b, 3)", { a: "1", b: "2" }), 6);
  assert.equal(run("ROUND(10 / 3, 2)"), 3.33);
  assert.equal(run("MIN(a, b)", { a: "4", b: "9" }), 4);
  assert.equal(run("max(a, b)", { a: "4", b: "9" }), 9, "function names are case-insensitive");
  assert.equal(run("IF(a > 5, 1, 2)", { a: "7" }), 1);
  assert.equal(run("IF(a > 5, 1, 2)", { a: "3" }), 2);
  assert.equal(run("FIRST(override, cost * 2)", { cost: "10" }), 20, "empty override falls through");
  assert.equal(run("FIRST(override, cost * 2)", { override: "15", cost: "10" }), 15);
});

test("empty fields count as 0; checkboxes as 1 / 0", () => {
  assert.equal(run("a + b", { a: "5" }), 5);
  assert.equal(run("IF(business, miles, 0)", { business: "true", miles: "42" }), 42);
});

test("BOM line and estimate header (state_records_pipeline.md)", () => {
  const line = computeFormulaValues(
    [
      { api_name: "line_total", formula: "line_quantity * unit_price" },
      { api_name: "unit_price", formula: "FIRST(price_override, unit_cost * (1 + markup_pct / 100))" },
      { api_name: "line_cost", formula: "line_quantity * unit_cost" },
    ],
    { line_quantity: "3", unit_cost: "20", markup_pct: "25" },
  );
  assert.deepEqual(line, { unit_price: "25", line_total: "75", line_cost: "60" });
  const header = computeFormulaValues(
    [
      { api_name: "margin", formula: "subtotal - cost_total" },
      { api_name: "margin_pct", formula: "IF(subtotal > 0, ROUND(margin / subtotal * 100, 1), 0)" },
    ],
    { subtotal: "75", cost_total: "60" },
  );
  assert.deepEqual(header, { margin: "15", margin_pct: "20" });
});

test("errors are plain sentences; loops are refused", () => {
  const bad = compileFormula("a + ");
  assert.equal(bad.ok, false);
  assert.match(bad.ok ? "" : bad.error, /ends too early/);
  assert.match((compileFormula("TOTAL(a)") as { error: string }).error, /Unknown function TOTAL/);
  assert.match((compileFormula("IF(a, b)") as { error: string }).error, /three parts/);
  assert.match((compileFormula("a $ b") as { error: string }).error, /Unexpected "\$"/);
  const loop = orderFormulas([
    { api_name: "a", formula: "b + 1" },
    { api_name: "b", formula: "a + 1" },
  ]);
  assert.equal(loop.ok, false);
  assert.match(loop.ok ? "" : loop.error, /a → b → a/);
});
