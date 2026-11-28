import assert from "node:assert/strict";
import test from "node:test";
(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;

test("Required fields: new records fill them, existing records may not empty them", async () => {
  const { requiredProblem, fillRequiredDefaults } = await import("./required-check");
  // Statistics: scale and frequency fields are Required.
  const full = { scale_start: "0", scale_end: "100", scale_step: "10", frequency_type: "month", frequency_start: "x", frequency_qty: "12", start_datetime: "2026-01-01T00:00", series_mode: "dynamic" };
  assert.equal(requiredProblem({ object: "statistics", data: full }), null);
  const { scale_end: _e, ...noEnd } = full;
  assert.match(requiredProblem({ object: "statistics", data: noEnd }) ?? "", /Required and empty: Scale High\. Fill it in/);
  // An existing record that never had the value still saves; emptying one it had does not.
  assert.equal(requiredProblem({ object: "statistics", data: noEnd, current: { data: noEnd } }), null);
  assert.match(requiredProblem({ object: "statistics", data: noEnd, current: { data: full } }) ?? "", /Scale High/);
  // Lines: a new mileage trip needs its Date; an old line without one still saves.
  const lines = [{ data: { trip_miles: "4" } }];
  assert.match(requiredProblem({ object: "treasury_vehicle_mileage_log", data: {}, lines }) ?? "", /line 1: Date/);
  assert.equal(requiredProblem({ object: "treasury_vehicle_mileage_log", data: {}, lines: [{ id: "l1", data: { trip_miles: "5" } }], current: { data: {}, lines: [{ id: "l1", data: { trip_miles: "4" } }] } }), null);
  // Configuration: the Record is Required only for Selection One.
  assert.match(requiredProblem({ object: "driver_pairing", data: { driver_id: "d", selection_mode: "one" } }) ?? "", /Record/);
  assert.equal(/\\bRecord\\b/.test(requiredProblem({ object: "driver_pairing", data: { driver_id: "d", selection_mode: "all" } }) ?? ""), false);
  // Defaults fill Required fields on a new record.
  const el: Record<string, string> = {};
  fillRequiredDefaults("page_element", el, "header");
  assert.equal(el.driver, "html-block");
});
