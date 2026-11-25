import assert from "node:assert/strict";
import test from "node:test";
import {
  applyStatHeaderChange,
  deriveSlotTarget,
  deriveStatHeaderData,
  openSeriesNumber,
  slotTarget,
  statPeriodProgress,
  statValueSteps,
  suggestScaleDivision,
} from "./model";

// Day x 7 with a Period target of 98 (14 a day), the examples signed off on 2026-11-14.
const week = { periodTarget: 98, frequencyQty: 7 };
const days = (values: Array<number | null>) =>
  values.flatMap((value, slot) => (value === null ? [] : [{ slot, value }]));

test("target per step is the period target divided by the steps", () => {
  assert.equal(slotTarget(98, 7), 14);
  assert.equal(slotTarget(null, 7), null);
  assert.equal(deriveSlotTarget({ period_target: "98", frequency_qty: "7" }), "14");
});

test("no target, no readout", () => {
  assert.equal(statPeriodProgress({ periodTarget: null, frequencyQty: 7 }, days([5]), true), null);
});

test("slow start: needed spreads the shortfall over the steps left", () => {
  const p = statPeriodProgress(week, days([1, 1]), true)!;
  assert.equal(p.met, 2);
  assert.equal(p.short, 96);
  assert.equal(p.stepsLeft, 5);
  assert.equal(p.needed, 19.2);
});

test("a blank step between filled steps counts as 0", () => {
  const p = statPeriodProgress(week, days([10, null, null, 10]), true)!;
  assert.equal(p.met, 20);
  assert.equal(p.stepsLeft, 3);
  assert.equal(p.needed, 26);
});

test("met early reads as over, nothing needed", () => {
  const p = statPeriodProgress(week, days([20, 20, 20, 20, 21]), true)!;
  assert.equal(p.over, 3);
  assert.equal(p.short, 0);
});

test("a closed period has no pace, only its shortfall", () => {
  const p = statPeriodProgress(week, days([12, 12, 12, 12, 12, 12, 12]), false)!;
  assert.equal(p.short, 14);
  assert.equal(p.needed, null);
});

test("scale division suggestion is about eight 1 / 2 / 5 steps", () => {
  assert.equal(suggestScaleDivision(0, 40), "5");
  assert.equal(suggestScaleDivision(0, 100), "10");
  assert.equal(suggestScaleDivision(0, 30), "5");
  assert.equal(suggestScaleDivision(0, 1000), "100");
  assert.equal(suggestScaleDivision(10, 5), "");
});

test("typing Scale High updates the suggestion but never the operator's own value", () => {
  let d: Record<string, string> = { scale_start: "0", scale_end: "", scale_step: "" };
  let prev = d;
  d = applyStatHeaderChange({ ...d, scale_end: "4" }, "scale_end", prev);
  prev = d;
  d = applyStatHeaderChange({ ...d, scale_end: "40" }, "scale_end", prev);
  assert.equal(d.scale_step, "5");
  const own = { ...d, scale_step: "2" };
  const after = applyStatHeaderChange({ ...own, scale_end: "100" }, "scale_end", own);
  assert.equal(after.scale_step, "2");
});

test("value arrows step by 1 on normal scales and smaller on tiny ones", () => {
  assert.deepEqual(statValueSteps({ scaleStart: 0, scaleEnd: 30 }), { step: 1, dragStep: 1 });
  assert.deepEqual(statValueSteps({ scaleStart: 0, scaleEnd: 1000 }), { step: 1, dragStep: 5 });
  assert.equal(statValueSteps({ scaleStart: 0, scaleEnd: 5 }).step, 0.1);
  assert.equal(statValueSteps({ scaleStart: 0, scaleEnd: 1 }).step, 0.01);
});

test("dynamic series opens the next period only when the current one is full", () => {
  const filled = (series: number, n: number) => Array.from({ length: n }, (_, slot) => ({ series, slot }));
  assert.equal(openSeriesNumber(filled(1, 3), 7, "dynamic"), 1);
  assert.equal(openSeriesNumber(filled(1, 7), 7, "dynamic"), 2);
  assert.equal(openSeriesNumber(filled(1, 7), 7, "single"), 1);
});

test("a statistic written through the record API gets the derived header fields", () => {
  const data = deriveStatHeaderData<Record<string, string>>({
    frequency_type: "day",
    start_datetime: "2026-11-09T07:00",
    frequency_qty: "7",
    period_target: "98",
  }, "America/New_York");
  assert.equal(data.frequency_start, "Mon");
  assert.equal(data.slot_target, "14");
  assert.equal("slot_target" in deriveStatHeaderData({ frequency_type: "day", start_datetime: "2026-11-09T07:00" }, "UTC"), false);
});
