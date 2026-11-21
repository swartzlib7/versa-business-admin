/**
 * Statistics -> Environment (S-4, 2026-09-12) - shared header + lines model.
 *
 * ONE validation layer shared by the UI capture form and the REST capture
 * endpoint (locked contract, state_statistics_environment.md): scale bounds,
 * frequency window, series capacity. Nothing slips past the rules regardless
 * of capture path.
 *
 * Header fields (environment_stat record header JSONB):
 *   name            - statistic name (record name)
 *   scale_name      - Scale Name: freeform axis title, rotated on the graph
 *   scale_start     - Scale Low: lowest expected for period (number, default 0)
 *   scale_end       - Scale High: highest expected for period (number, required, > scale_start)
 *   scale_step      - Scale Division: axis divider (number, required, > 0)
 *   frequency_type  - sec|min|hour|day|week|month|year|decade|date|datetime
 *   frequency_start - derived from start_datetime + frequency_type (readonly)
 *   frequency_qty   - number of steps from the start (>= 1)
 *   start_datetime  - absolute clock that seeds each series window
 *   series_mode     - dynamic | single  (labels: Dynamic Series / Single Series)
 *   period_target   - optional quota for one period (series), e.g. 98 parts a week
 *   slot_target     - read-only: period_target / frequency_qty, shown on the form
 *
 * Lines (stat_line rows): header_id, series, slot, value, captured_at, source.
 */

import { applyDerivedFrequencyStart, deriveFrequencyStart } from './frequency';

export const FREQUENCY_TYPES = [
  'sec', 'min', 'hour', 'day', 'week', 'month', 'year', 'decade', 'date', 'datetime',
] as const;
export type FrequencyType = (typeof FREQUENCY_TYPES)[number];

export const SERIES_MODES = ['dynamic', 'single'] as const;
export type SeriesMode = (typeof SERIES_MODES)[number];

/** UI labels per Stephen (locked 2026-09-12). */
export const SERIES_MODE_LABELS: Record<SeriesMode, string> = {
  dynamic: 'Dynamic Series',
  single: 'Single Series',
};

/** Line-column label for line_slot = the selected Frequency type. */
export const FREQUENCY_TYPE_LABELS: Record<FrequencyType, string> = {
  sec: 'Second',
  min: 'Minute',
  hour: 'Hour',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  decade: 'Decade',
  date: 'Date',
  datetime: 'Datetime',
};

export function frequencyTypeLabel(type: string | undefined): string {
  if (type && (FREQUENCY_TYPES as readonly string[]).includes(type)) {
    return FREQUENCY_TYPE_LABELS[type as FrequencyType];
  }
  return 'Day';
}

export interface StatHeaderConfig {
  scaleName: string;
  scaleStart: number;
  scaleEnd: number;
  scaleStep: number;
  frequencyType: FrequencyType;
  frequencyStart: string;
  frequencyQty: number;
  startDatetime: string;
  seriesMode: SeriesMode;
  /** Quota for one period (series). null = no target set. */
  periodTarget: number | null;
  /** 1.0.14: values come from the lines of this record type (null = entered by hand). */
  sourceRecordType: string | null;
}

export type StatHeaderParse =
  | { ok: true; config: StatHeaderConfig }
  | { ok: false; errors: string[] };

function toNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : null;
}

function toInt(raw: unknown): number | null {
  const n = toNumber(raw);
  return n === null ? null : Math.trunc(n);
}

/**
 * Parse + validate a header configuration. Returns every violation, not just
 * the first - the UI form shows all errors, the API returns them in one body.
 */
export function parseStatHeaderConfig(data: Record<string, unknown>): StatHeaderParse {
  const errors: string[] = [];

  const scaleStart = toNumber(data.scale_start);
  if (scaleStart === null) errors.push('Scale Low must be a number.');

  const scaleEnd = toNumber(data.scale_end);
  if (scaleEnd === null) errors.push('Scale High must be a number.');

  const scaleStep = toNumber(data.scale_step);
  if (scaleStep === null || scaleStep <= 0) {
    errors.push('Scale Division must be a number greater than 0.');
  }

  if (scaleStart !== null && scaleEnd !== null && scaleEnd <= scaleStart) {
    errors.push('Scale High must be greater than Scale Low.');
  }

  const frequencyType = String(data.frequency_type ?? '').trim() as FrequencyType;
  if (!FREQUENCY_TYPES.includes(frequencyType)) {
    errors.push('Frequency type must be one of: ' + FREQUENCY_TYPES.join(', ') + '.');
  }

  const startDatetime = String(data.start_datetime ?? '').trim();
  if (!startDatetime) errors.push('Start datetime is required.');

  const derivedStart = deriveFrequencyStart(frequencyType, startDatetime);
  const frequencyStart = (derivedStart ?? String(data.frequency_start ?? '').trim());
  if (!frequencyStart) {
    errors.push('Frequency start is derived from Start datetime and Frequency type.');
  }

  const frequencyQty = toInt(data.frequency_qty);
  if (frequencyQty === null || frequencyQty < 1) {
    errors.push('Frequency quantity must be a whole number of at least 1.');
  }

  const seriesModeRaw = String(data.series_mode ?? 'dynamic').trim() as SeriesMode;
  const seriesMode: SeriesMode = seriesModeRaw === 'single' ? 'single' : 'dynamic';
  if (seriesModeRaw && seriesModeRaw !== 'single' && seriesModeRaw !== 'dynamic') {
    errors.push('Series mode must be dynamic or single.');
  }

  const scaleName = String(data.scale_name ?? '').trim();

  const targetRaw = String(data.period_target ?? '').trim();
  const periodTarget = targetRaw ? toNumber(targetRaw) : null;
  if (targetRaw && (periodTarget === null || periodTarget < 0)) {
    errors.push('Period target must be a number of 0 or more.');
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    config: {
      scaleName,
      scaleStart: scaleStart as number,
      scaleEnd: scaleEnd as number,
      scaleStep: scaleStep as number,
      frequencyType,
      frequencyStart,
      frequencyQty: frequencyQty as number,
      startDatetime,
      seriesMode,
      periodTarget,
      // Fed from records only when both the type and the date field are set (source-values.ts).
      sourceRecordType:
        typeof data.source_record_type === 'string' &&
        data.source_record_type.trim() &&
        typeof data.source_date_field === 'string' &&
        data.source_date_field.trim()
          ? data.source_record_type.trim()
          : null,
    },
  };
}

/** Target for one frequency step: the period target spread evenly. */
export function slotTarget(periodTarget: number | null, frequencyQty: number): number | null {
  if (periodTarget === null || !Number.isFinite(periodTarget) || frequencyQty < 1) return null;
  return periodTarget / frequencyQty;
}

/** Read-only form value for slot_target from raw header values ('' when not set). */
export function deriveSlotTarget(values: Record<string, unknown>): string {
  const target = toNumber(values.period_target);
  const qty = toInt(values.frequency_qty);
  if (target === null || target < 0 || qty === null || qty < 1) return '';
  return String(Math.round((target / qty) * 100) / 100);
}

/**
 * Server side (record API create / update): fill the derived header fields
 * the UI fills as the operator types. A statistic written by a script gets
 * the same stored Frequency start and Target per step as one made on screen.
 */
export function deriveStatHeaderData<T extends Record<string, string>>(data: T): T {
  const out = applyDerivedFrequencyStart(data);
  if (!('period_target' in out) && !('slot_target' in out)) return out;
  return { ...out, slot_target: deriveSlotTarget(out) };
}

export interface StatPeriodProgress {
  quota: number;
  /** Sum of captured values. A blank step between captured steps counts as 0. */
  met: number;
  short: number;
  over: number;
  /** Steps after the last captured step. 0 when the period is closed. */
  stepsLeft: number;
  /** Per-step value still needed to reach the quota. null when nothing is left to do. */
  needed: number | null;
  /** Last captured slot, -1 when nothing is captured yet. */
  lastSlot: number;
}

/**
 * Target progress for one period. Catch-up only applies to the period still
 * being captured (open). A closed period reports what it was short at close.
 */
export function statPeriodProgress(
  config: Pick<StatHeaderConfig, 'periodTarget' | 'frequencyQty'>,
  lines: Array<{ slot: number; value: number }>,
  open: boolean,
): StatPeriodProgress | null {
  if (config.periodTarget === null) return null;
  const quota = config.periodTarget;
  let met = 0;
  let lastSlot = -1;
  for (const ln of lines) {
    if (!Number.isFinite(ln.value) || !Number.isInteger(ln.slot)) continue;
    met += ln.value;
    if (ln.slot > lastSlot) lastSlot = ln.slot;
  }
  const short = Math.max(0, quota - met);
  const over = Math.max(0, met - quota);
  const stepsLeft = open && lastSlot >= 0 ? Math.max(0, config.frequencyQty - 1 - lastSlot) : 0;
  const needed = short > 0 && stepsLeft > 0 ? short / stepsLeft : null;
  return { quota, met, short, over, stepsLeft, needed, lastSlot };
}

/**
 * Suggested Scale Division for a scale range: about eight divisions, rounded
 * to 1, 2 or 5 times a power of ten. Used only while Scale Division is empty.
 */
export function suggestScaleDivision(low: unknown, high: unknown): string {
  const lo = toNumber(low) ?? 0;
  const hi = toNumber(high);
  if (hi === null || hi <= lo) return '';
  const raw = (hi - lo) / 8;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = raw / power;
  const nice = unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10;
  const step = nice * power;
  return String(Number(step.toPrecision(6)));
}

/**
 * Arrow and drag steps for a value input on this scale. `step` is one arrow
 * click (whole numbers on most scales, decimals on small ones). `dragStep` is
 * one notch of a drag, sized so a short drag can cross the whole scale.
 */
export function statValueSteps(config: Pick<StatHeaderConfig, 'scaleStart' | 'scaleEnd'>): {
  step: number;
  dragStep: number;
} {
  const span = Math.abs(config.scaleEnd - config.scaleStart);
  const step = span >= 20 ? 1 : span >= 2 ? 0.1 : 0.01;
  const raw = span / 150;
  if (!(raw > step)) return { step, dragStep: step };
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const unit = raw / power;
  const nice = unit < 1.5 ? 1 : unit < 3.5 ? 2 : unit < 7.5 ? 5 : 10;
  return { step, dragStep: Number((nice * power).toPrecision(6)) };
}

/** Read a header config from a record instance (header JSONB). */
export function statHeaderConfigFromData(data: Record<string, unknown>): StatHeaderParse {
  return parseStatHeaderConfig(data);
}

/** Occupied (series, slot) pairs — seeded empty rows count as occupied. */
export type StatOccupiedSlot = { series: number; slot: number };

/**
 * First series that still has a free frequency slot. Single Series stays on 1
 * even when full. Dynamic Series opens series+1 after the window is seeded.
 */
export function openSeriesNumber(
  occupied: StatOccupiedSlot[],
  frequencyQty: number,
  seriesMode: SeriesMode,
): number {
  const bySeries = new Map<number, Set<number>>();
  for (const row of occupied) {
    if (!Number.isInteger(row.series) || !Number.isInteger(row.slot)) continue;
    const set = bySeries.get(row.series) ?? new Set<number>();
    set.add(row.slot);
    bySeries.set(row.series, set);
  }
  const seriesNums = [...bySeries.keys()].sort((a, b) => a - b);
  if (!seriesNums.length) return 1;
  for (const series of seriesNums) {
    if ((bySeries.get(series)?.size ?? 0) < frequencyQty) return series;
  }
  if (seriesMode === 'single') return 1;
  return (seriesNums[seriesNums.length - 1] ?? 1) + 1;
}

export function usedSlotsInSeries(
  occupied: StatOccupiedSlot[],
  series: number,
): number[] {
  return occupied
    .filter((row) => row.series === series && Number.isInteger(row.slot))
    .map((row) => row.slot);
}

/** Graph points skip empty/unfilled seeded slots. */
export function statRowsToGraphPoints(
  rows: Array<{ series?: number; slot: number; value?: string | number | null }>,
): Array<{ series: number; slot: number; value: number }> {
  const out: Array<{ series: number; slot: number; value: number }> = [];
  for (const row of rows) {
    if (row.value == null || row.value === '') continue;
    const value = Number(row.value);
    if (!Number.isFinite(value)) continue;
    const slot = Number(row.slot);
    if (!Number.isInteger(slot)) continue;
    out.push({
      series: Number(row.series ?? 1) || 1,
      slot,
      value,
    });
  }
  return out;
}

/**
 * Derived Statistics header values, applied on every form change and before
 * save. Only touches keys the form already has, so other record types pass
 * through unchanged:
 *   - frequency_start from Frequency type + Start datetime
 *   - slot_target from Period target / Frequency quantity
 *   - scale_step suggested from Scale Low / High while it is empty or still
 *     holds the previous suggestion (an operator's own value is never replaced)
 * `prev` is the form before this change; omit it (and `changedKey`) on save.
 */
export function applyStatHeaderChange<T extends Record<string, string>>(
  next: T,
  changedKey?: string,
  prev?: Record<string, string>,
): T {
  let out = next;
  if (!changedKey || changedKey === 'frequency_type' || changedKey === 'start_datetime') {
    out = applyDerivedFrequencyStart(out);
  }
  if (
    'slot_target' in out &&
    (!changedKey || changedKey === 'period_target' || changedKey === 'frequency_qty')
  ) {
    out = { ...out, slot_target: deriveSlotTarget(out) };
  }
  if (
    prev &&
    'scale_step' in out &&
    (changedKey === 'scale_start' || changedKey === 'scale_end')
  ) {
    const current = String(out.scale_step ?? '').trim();
    const previousSuggestion = suggestScaleDivision(prev.scale_start, prev.scale_end);
    if (!current || current === previousSuggestion) {
      out = { ...out, scale_step: suggestScaleDivision(out.scale_start, out.scale_end) };
    }
  }
  return out;
}
