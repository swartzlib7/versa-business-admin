import assert from "node:assert/strict";
import test from "node:test";
import { advanceFrequency, deriveFrequencyStart, formatStamp, frequencySlotLabels, parseStartDatetime, stampForSlot, stepIndexForDate, toDatetimeLocalValue } from "./frequency";
import { parseStatHeaderConfig } from "./model";
import { isTimeZone, wallClock, zonedInstant } from "./time-zone";

const NY = "America/New_York";

// The case from the 2026-11-25 brief: the same statistic on an Eastern host and a UTC host.
test("Start datetime is read in the statistic's zone, not the process zone", () => {
  assert.equal(parseStartDatetime("2026-11-12T00:00", NY)!.toISOString(), "2026-11-12T05:00:00.000Z");
  assert.equal(parseStartDatetime("2026-11-12T00:00", "UTC")!.toISOString(), "2026-11-12T00:00:00.000Z");
  assert.equal(parseStartDatetime("2026-11-12T00:00:00Z", NY)!.toISOString(), "2026-11-12T00:00:00.000Z", "an ISO instant stays that instant");
  assert.equal(parseStartDatetime("2026-11-12", NY)!.toISOString(), "2026-11-12T05:00:00.000Z", "a date is midnight in the zone");
});

test("a daily statistic keeps one slot per calendar day across the March and November changes", () => {
  const start = parseStartDatetime("2027-03-12T00:00", NY)!;
  const days = [0, 1, 2, 3].map((i) => stampForSlot(start, "day", 1, i, 7, NY));
  assert.deepEqual(days.map((d) => formatStamp(d, NY)), [
    "12 Mar 2027 @ 00:00:00",
    "13 Mar 2027 @ 00:00:00",
    "14 Mar 2027 @ 00:00:00",
    "15 Mar 2027 @ 00:00:00",
  ]);
  assert.equal(days[2].getTime() - days[1].getTime(), 24 * 3_600_000);
  assert.equal(days[3].getTime() - days[2].getTime(), 23 * 3_600_000, "14 March is 23 hours long, still one slot");
  const fall = parseStartDatetime("2026-10-31T00:00", NY)!;
  assert.equal(formatStamp(stampForSlot(fall, "day", 1, 2, 7, NY), NY), "2 Nov 2026 @ 00:00:00");
  // A line dated on the day after the change still lands in that day's slot.
  assert.equal(stepIndexForDate(start, "day", parseStartDatetime("2027-03-14T00:30", NY)!, NY), 2);
});

test("hours step by fixed time; weeks, months and years by the calendar in the zone", () => {
  const start = parseStartDatetime("2027-03-14T00:00", NY)!;
  assert.equal(formatStamp(advanceFrequency(start, "hour", 3, NY), NY), "14 Mar 2027 @ 04:00:00", "02:00 does not exist that night");
  const jan = parseStartDatetime("2026-01-31T09:00", NY)!;
  assert.equal(formatStamp(advanceFrequency(jan, "week", 6, NY), NY), "14 Mar 2026 @ 09:00:00");
  assert.equal(formatStamp(advanceFrequency(parseStartDatetime("2026-01-15T09:00", NY)!, "month", 3, NY), NY), "15 Apr 2026 @ 09:00:00");
  assert.equal(formatStamp(advanceFrequency(jan, "year", 1, NY), NY), "31 Jan 2027 @ 09:00:00");
});

test("the same wall clock gives the same slots on any host", () => {
  // Both sides read the statistic's own zone: slot instants are equal, so S2 passes.
  const a = stampForSlot(parseStartDatetime("2026-11-12T00:00", NY)!, "day", 2, 3, 7, NY);
  const b = stampForSlot(parseStartDatetime("2026-11-12T00:00", NY)!, "day", 2, 3, 7, NY);
  assert.equal(a.toISOString(), b.toISOString());
  assert.equal(a.toISOString(), "2026-11-22T05:00:00.000Z");
});

test("labels and the form value are wall clocks", () => {
  const at = parseStartDatetime("2026-11-01T00:30", NY)!;
  assert.equal(toDatetimeLocalValue(at, NY), "2026-11-01T00:30");
  assert.equal(deriveFrequencyStart("day", "2026-11-09T07:00", NY), "Mon");
  assert.equal(deriveFrequencyStart("datetime", "2026-11-09T07:00", "Asia/Tokyo"), "9 Nov 2026 @ 07:00:00");
  const parsed = parseStatHeaderConfig({ scale_start: "0", scale_end: "10", scale_step: "1", frequency_type: "date", start_datetime: "2027-03-13T00:00", frequency_qty: "3" }, NY);
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  assert.equal(parsed.config.timeZone, NY, "no zone of its own: the install's");
  assert.deepEqual(frequencySlotLabels(parsed.config, 3), ["13 Mar 2027", "14 Mar 2027", "15 Mar 2027"]);
});

test("a statistic's own zone wins; a bad zone is refused", () => {
  const base = { scale_start: "0", scale_end: "10", scale_step: "1", frequency_type: "day", start_datetime: "2026-11-12T00:00", frequency_qty: "7" };
  const own = parseStatHeaderConfig({ ...base, time_zone: "Europe/London" }, NY);
  assert.ok(own.ok && own.config.timeZone === "Europe/London");
  const bad = parseStatHeaderConfig({ ...base, time_zone: "Mars/Olympus" }, NY);
  assert.ok(!bad.ok && bad.errors.some((e) => /Time zone/.test(e)));
});

test("zone helpers", () => {
  assert.ok(isTimeZone("UTC") && isTimeZone(NY) && !isTimeZone("") && !isTimeZone("Nowhere/Here"));
  assert.equal(wallClock(new Date("2026-07-01T04:00:00Z"), NY).hour, 0);
  // 01:30 happens twice on 1 Nov 2026 in New York: the first one.
  assert.equal(zonedInstant(NY, 2026, 10, 1, 1, 30).toISOString(), "2026-11-01T05:30:00.000Z");
});
