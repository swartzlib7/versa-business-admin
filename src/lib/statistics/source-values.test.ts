import assert from "node:assert/strict";
import test from "node:test";
import { parseStartDatetime, stepIndexForDate } from "./frequency";
import { computeSourceSteps, statSourceFromData, stepToSeriesSlot, withRecordFields } from "./source-values";

const NY = "America/New_York";
const at = (wall: string) => parseStartDatetime(wall, NY)!;

test("a date lands in the step it falls in", () => {
  const start = at("2026-01-01T00:00");
  assert.equal(stepIndexForDate(start, "month", at("2026-01-31"), NY), 0);
  assert.equal(stepIndexForDate(start, "month", at("2026-11-19"), NY), 10);
  assert.equal(stepIndexForDate(start, "month", at("2027-02-01"), NY), 13);
  assert.equal(stepIndexForDate(start, "day", at("2026-01-08"), NY), 7);
  assert.equal(stepIndexForDate(start, "week", at("2026-01-15"), NY), 2);
  assert.equal(stepIndexForDate(start, "month", at("2025-12-31"), NY), -1);
});

const config = { startDatetime: "2026-01-01T00:00", frequencyType: "month" as const, frequencyQty: 12, seriesMode: "dynamic" as const, timeZone: NY };
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

test("1.0.25: line quantities dated by the record's date, only records with a status", () => {
  const shipped = statSourceFromData({
    source_record_type: "production_shipment",
    source_date_field: "ship_date",
    source_value_field: "line_qty_shipped",
    source_filter_field: "status",
    source_filter_value: "shipped",
  })!;
  const lines = withRecordFields([
    { name: "SH-1", data: { ship_date: "2026-09-03", status: "shipped" }, lines: [{ data: { line_qty_shipped: "6" } }, { data: { line_qty_shipped: "2" } }] },
    { name: "SH-2", data: { ship_date: "2026-10-12", status: "shipped" }, lines: [{ data: { line_qty_shipped: "10" } }] },
    { name: "SH-3", data: { ship_date: "2026-10-20", status: "draft" }, lines: [{ data: { line_qty_shipped: "99" } }] },
  ]);
  assert.equal(lines.length, 4);
  assert.equal(lines[0].ship_date, "2026-09-03");
  const steps = computeSourceSteps(config, shipped, lines);
  assert.equal(steps.get(8), 8, "September: 6 + 2");
  assert.equal(steps.get(9), 10, "October: the draft is left out");
});

test("1.0.25: a line value wins over the record's for a shared key", () => {
  const [line] = withRecordFields([{ name: "R", status: "active", data: { id: "rec", note: "x" }, lines: [{ data: { id: "line" } }] }]);
  assert.equal(line.id, "line");
  assert.equal(line.name, "R");
  assert.equal(line.status, "active");
});

test("a filter with several values separated by commas matches any of them (1.0.26)", () => {
  const shipped = statSourceFromData({
    source_record_type: "production_shipment",
    source_date_field: "ship_date",
    source_value_field: "line_qty_shipped",
    source_filter_field: "status",
    source_filter_value: "shipped, delivered",
  })!;
  const steps = computeSourceSteps(config, shipped, [
    { ship_date: "2026-10-02", line_qty_shipped: "4", status: "shipped" },
    { ship_date: "2026-10-09", line_qty_shipped: "6", status: "Delivered" },
    { ship_date: "2026-10-12", line_qty_shipped: "50", status: "packed" },
    { ship_date: "2026-10-20", line_qty_shipped: "70", status: "draft" },
  ]);
  assert.equal(steps.get(9), 10);
});
