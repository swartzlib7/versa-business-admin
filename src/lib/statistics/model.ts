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
 *
 * Lines (stat_line rows): header_id, series, slot, value, captured_at, source.
 */

import { deriveFrequencyStart } from './frequency';

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
    },
  };
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
