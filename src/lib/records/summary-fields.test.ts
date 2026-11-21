import assert from "node:assert/strict";
import test from "node:test";
import { computeSummaryValues, normalizeSummaryConfig, summaryConfigProblem } from "./summary-fields";

// The Vehicle Mileage Log shipped in 1.0.14.
const fields = [
  { api_name: "total_miles", data_type: "summary", summary: { aggregate: "sum" as const, source_field: "trip_miles" } },
  { api_name: "business_miles", data_type: "summary", summary: { aggregate: "sum" as const, source_field: "trip_miles", filter_field: "trip_business", filter_value: "true" } },
  { api_name: "business_use_pct", data_type: "summary", summary: { aggregate: "sum" as const, source_field: "trip_miles", filter_field: "trip_business", filter_value: "true", percent_of: "total_miles" } },
  { api_name: "trips", data_type: "summary", summary: { aggregate: "count" as const } },
  { api_name: "longest", data_type: "summary", summary: { aggregate: "max" as const, source_field: "trip_miles" } },
];
const trips = [
  { trip_miles: "42", trip_business: "true" },
  { trip_miles: "18", trip_business: "false" },
  { trip_miles: "60", trip_business: "true" },
  { trip_miles: "", trip_business: "true" },
];

test("mileage log totals, business miles and business-use %", () => {
  const v = computeSummaryValues(fields, trips);
  assert.equal(v.total_miles, "120");
  assert.equal(v.business_miles, "102");
  assert.equal(v.business_use_pct, "85");
  assert.equal(v.trips, "4");
  assert.equal(v.longest, "60");
});

test("no lines: sums are 0, max and percentages are empty", () => {
  const v = computeSummaryValues(fields, []);
  assert.equal(v.total_miles, "0");
  assert.equal(v.business_use_pct, "");
  assert.equal(v.longest, "");
});

test("config checks", () => {
  const lineFields = [
    { api_name: "trip_miles", data_type: "number" },
    { api_name: "trip_purpose", data_type: "text" },
  ];
  assert.equal(normalizeSummaryConfig({ aggregate: "median" }), null);
  assert.match(String(summaryConfigProblem(normalizeSummaryConfig({ aggregate: "sum" }), lineFields, [])), /lines field/);
  assert.match(String(summaryConfigProblem(normalizeSummaryConfig({ aggregate: "sum", source_field: "trip_purpose" }), lineFields, [])), /Number/);
  assert.equal(summaryConfigProblem(normalizeSummaryConfig({ aggregate: "count" }), lineFields, []), null);
  assert.match(String(summaryConfigProblem(normalizeSummaryConfig({ aggregate: "count", percent_of: "x" }), lineFields, [])), /percentage/);
});
