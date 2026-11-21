import assert from "node:assert/strict";
import test from "node:test";
import { stepIndexForDate } from "./frequency";
import { computeSourceSteps, statSourceFromData, stepToSeriesSlot } from "./source-values";

test("a date lands in the step it falls in", () => {
  const start = new Date(2026, 0, 1);
  assert.equal(stepIndexForDate(start, "month", new Date(2026, 0, 31)), 0);
  assert.equal(stepIndexForDate(start, "month", new Date(2026, 10, 19)), 10);
  assert.equal(stepIndexForDate(start, "month", new Date(2027, 1, 1)), 13);
  assert.equal(stepIndexForDate(start, "day", new Date(2026, 0, 8)), 7);
  assert.equal(stepIndexForDate(start, "week", new Date(2026, 0, 15)), 2);
  assert.equal(stepIndexForDate(start, "month", new Date(2025, 11, 31)), -1);
});

const config = { startDatetime: "2026-01-01T00:00", frequencyType: "month" as const, frequencyQty: 12, seriesMode: "dynamic" as const };
const source = statSourceFromData({
  source_record_type: "treasury_vehicle_mileage_log",
  source_date_field: "trip_date",
  source_value_field: "trip_miles",
  source_filter_field: "trip_business",
  source_filter_value: "true",
})!;

test("monthly business miles from trip lines", () => {
  const steps = computeSourceSteps(config, source, [
    { trip_date: "2026-09-03", trip_miles: "40", trip_business: "true" },
    { trip_date: "2026-09-20", trip_miles: "25", trip_business: "true" },
    { trip_date: "2026-09-21", trip_miles: "300", trip_business: "false" },
    { trip_date: "2026-11-02", trip_miles: "12", trip_business: "true" },
    { trip_date: "2027-01-05", trip_miles: "7", trip_business: "true" },
  ]);
  assert.equal(steps.get(8), 65);
  assert.equal(steps.get(9), 0, "a month between months with trips is 0");
  assert.equal(steps.get(10), 12);
  assert.equal(steps.get(12), 7, "next year lands in period 2");
  assert.equal(steps.has(7), false, "before the first trip stays empty");
  assert.deepEqual(stepToSeriesSlot(12, 12), { series: 2, slot: 0 });
});

test("no value field counts lines; single series ignores later periods", () => {
  const counting = statSourceFromData({ source_record_type: "t", source_date_field: "d" })!;
  const steps = computeSourceSteps({ ...config, seriesMode: "single" }, counting, [
    { d: "2026-02-10" },
    { d: "2026-02-11" },
    { d: "2027-02-11" },
  ]);
  assert.equal(steps.get(1), 2);
  assert.equal(steps.has(13), false);
  assert.equal(statSourceFromData({ source_record_type: "t" }), null, "no date field, no source");
});
