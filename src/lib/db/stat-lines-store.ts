/**
 * I5.6.35 S-4 (2026-09-12) - stat_line persistence (Statistics -> Environment).
 *
 * Captured data points for statistic headers (record rows of type
 * environment_stat). Capacity + window validation lives in
 * src/lib/statistics/model.ts (the ONE shared layer); this store enforces the
 * resulting rules at the DB boundary:
 *   - slot must fall inside the header's frequency window (0..qty-1)
 *   - value must fall inside the scale bounds (scale_start..scale_end)
 *   - series capacity: Single Series refuses a second series; Dynamic
 *     Series closes a full series and continues fresh from the next slot
 *     (the caller passes the resolved series; the store refuses slots that
 *     are already taken - unique index is the last line of defense).
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import { getDb } from './client';
import { record as recordTable, recordType as recordTypeTable, statLine as statLineTable } from './schema';
import {
  openSeriesNumber,
  parseStatHeaderConfig,
  statHeaderConfigFromData,
  type StatHeaderConfig,
} from '@/lib/statistics/model';
import { parseStartDatetime, stampForSlot } from '@/lib/statistics/frequency';

export interface StatLineRow {
  id: string;
  header_id: string;
  series: number;
  slot: number;
  value: string;
  captured_at: string;
  stamp: string | null;
  source: string;
  /** 1.0.20: last change of any kind. */
  updated_at?: string;
  /** 1.0.20: when the row was made (a seeded empty slot has updated_at ≈ created_at). */
  created_at?: string;
}

function mapRow(ln: typeof statLineTable.$inferSelect): StatLineRow {
  return {
    id: ln.id,
    header_id: ln.headerId,
    series: ln.series,
    slot: ln.slot,
    value: ln.value == null ? '' : String(ln.value),
    captured_at: (ln.capturedAt instanceof Date ? ln.capturedAt : new Date(ln.capturedAt)).toISOString(),
    stamp: ln.stamp
      ? (ln.stamp instanceof Date ? ln.stamp : new Date(ln.stamp)).toISOString()
      : null,
    source: ln.source,
    updated_at: (ln.updatedAt instanceof Date ? ln.updatedAt : new Date(ln.updatedAt)).toISOString(),
    created_at: (ln.createdAt instanceof Date ? ln.createdAt : new Date(ln.createdAt)).toISOString(),
  };
}

/** Load + validate a header's configuration from its record row. */
export async function loadStatHeaderConfig(
  headerId: string,
): Promise<{ ok: true; config: StatHeaderConfig } | { ok: false; code: string; message: string }> {
  const db = getDb();
  const rows = await db
    .select({ header: recordTable.header, createdAt: recordTable.createdAt })
    .from(recordTable)
    .innerJoin(recordTypeTable, eq(recordTable.recordTypeId, recordTypeTable.id))
    .where(and(eq(recordTable.id, headerId), eq(recordTypeTable.apiName, 'statistics')))
    .limit(1);
  if (!rows.length) {
    return { ok: false, code: 'HEADER_NOT_FOUND', message: 'Statistic header not found.' };
  }
  const raw = { ...((rows[0].header ?? {}) as Record<string, unknown>) };
  if (!String(raw.start_datetime ?? "").trim() && rows[0].createdAt) {
    raw.start_datetime = (rows[0].createdAt instanceof Date
      ? rows[0].createdAt
      : new Date(rows[0].createdAt)
    ).toISOString();
  }
  const { installTimeZone } = await import('@/lib/settings/install-time-zone');
  const parsed = statHeaderConfigFromData(raw, installTimeZone());
  if (!parsed.ok) {
    return {
      ok: false,
      code: 'HEADER_CONFIG_INVALID',
      message: 'Header configuration is incomplete: ' + parsed.errors.join(' '),
    };
  }
  return { ok: true, config: parsed.config };
}

function resolveStamp(cfg: StatHeaderConfig, series: number, slot: number): Date | null {
  const start = parseStartDatetime(cfg.startDatetime, cfg.timeZone);
  if (!start) return null;
  return stampForSlot(start, cfg.frequencyType, series, slot, cfg.frequencyQty, cfg.timeZone);
}

export async function listStatLinesDb(
  headerId: string,
  series?: number,
): Promise<StatLineRow[]> {
  const db = getDb();
  const where = series === undefined
    ? eq(statLineTable.headerId, headerId)
    : and(eq(statLineTable.headerId, headerId), eq(statLineTable.series, series));
  const rows = await db
    .select()
    .from(statLineTable)
    .where(where)
    .orderBy(asc(statLineTable.series), asc(statLineTable.slot));
  return rows.map(mapRow);
}

export async function listStatLinesForHeaders(
  headerIds: string[],
): Promise<Map<string, StatLineRow[]>> {
  const map = new Map<string, StatLineRow[]>();
  if (!headerIds.length) return map;
  const db = getDb();
  const rows = await db
    .select()
    .from(statLineTable)
    .where(inArray(statLineTable.headerId, headerIds))
    .orderBy(asc(statLineTable.series), asc(statLineTable.slot));
  for (const ln of rows) {
    const mapped = mapRow(ln);
    const list = map.get(mapped.header_id) ?? [];
    list.push(mapped);
    map.set(mapped.header_id, list);
  }
  return map;
}

/**
 * Reserve every configured frequency slot on series 1. Value stays empty
 * until capture. Existing slots (any value) are left alone.
 */
export async function seedStatLinesForHeader(headerId: string): Promise<StatLineRow[]> {
  const header = await loadStatHeaderConfig(headerId);
  if (!header.ok) return [];
  const existing = await listStatLinesDb(headerId, 1);
  const used = new Set(existing.map((ln) => ln.slot));
  const toInsert: Array<{
    headerId: string;
    series: number;
    slot: number;
    value: null;
    source: string;
    stamp: Date | null;
  }> = [];
  for (let slot = 0; slot < header.config.frequencyQty; slot++) {
    if (used.has(slot)) continue;
    toInsert.push({
      headerId,
      series: 1,
      slot,
      value: null,
      source: 'seed',
      stamp: resolveStamp(header.config, 1, slot),
    });
  }
  if (toInsert.length) {
    const db = getDb();
    await db.insert(statLineTable).values(toInsert);
  }
  return listStatLinesDb(headerId);
}

export interface CaptureLineInput {
  headerId: string;
  series?: number;
  slot: number;
  value: number;
  source?: string;
}

export type CaptureLineResult =
  | { ok: true; line: StatLineRow }
  | { ok: false; code: string; message: string };

/**
 * Capture one line. Enforces (through the shared model): slot inside the
 * frequency window, value inside scale bounds, series capacity per mode.
 * The unique (header_id, series, slot) index makes double-capture a no-op
 * conflict rather than a silent overwrite.
 */
export async function captureStatLineDb(input: CaptureLineInput): Promise<CaptureLineResult> {
  const db = getDb();

  const header = await loadStatHeaderConfig(input.headerId);
  if (!header.ok) return header;

  const cfg = header.config;
  if (!Number.isInteger(input.slot) || input.slot < 0 || input.slot >= cfg.frequencyQty) {
    return {
      ok: false,
      code: 'SLOT_OUT_OF_WINDOW',
      message: 'Slot must be an integer within the frequency window (0 to ' + (cfg.frequencyQty - 1) + ').',
    };
  }
  if (!Number.isFinite(input.value) || input.value < cfg.scaleStart || input.value > cfg.scaleEnd) {
    return {
      ok: false,
      code: 'VALUE_OUT_OF_SCALE',
      message: 'Value must be within the scale bounds (' + cfg.scaleStart + ' to ' + cfg.scaleEnd + ').',
    };
  }

  const existingRows = await listStatLinesDb(input.headerId);
  let series = input.series;
  if (series === undefined) {
    series = openSeriesNumber(
      existingRows.map((ln) => ({ series: ln.series, slot: ln.slot })),
      cfg.frequencyQty,
      cfg.seriesMode,
    );
  }

  if (cfg.seriesMode === 'single') {
    const seriesUsed = new Set(existingRows.map((ln) => ln.series));
    if (seriesUsed.size > 1 || (seriesUsed.size === 1 && !seriesUsed.has(series))) {
      return {
        ok: false,
        code: 'SERIES_FULL',
        message: 'Single Series: this header holds exactly one series and it is full. New lines are refused.',
      };
    }
  }

  const stamp = resolveStamp(cfg, series as number, input.slot);
  if (stamp) {
    const stampTaken = existingRows.find(
      (ln) => ln.stamp && new Date(ln.stamp).getTime() === stamp.getTime() &&
        !(ln.series === series && ln.slot === input.slot),
    );
    if (stampTaken) {
      return {
        ok: false,
        code: 'STAMP_TAKEN',
        message: 'A line is already captured for ' + stamp.toISOString() + '.',
      };
    }
  }

  const taken = existingRows.find((ln) => ln.series === series && ln.slot === input.slot);
  if (taken) {
    if (taken.value.trim() !== '') {
      return {
        ok: false,
        code: 'SLOT_TAKEN',
        message: 'Series ' + series + ' slot ' + input.slot + ' is already seeded. Use a different frequency value.',
      };
    }
    const filled = await db
      .update(statLineTable)
      .set({
        value: String(input.value),
        source: input.source ?? 'ui',
        capturedAt: new Date(),
        updatedAt: new Date(),
        stamp: stamp ?? undefined,
      })
      .where(eq(statLineTable.id, taken.id))
      .returning();
    await notifyIntegrations(input.headerId, mapRow(filled[0]), 'upsert');
    return { ok: true, line: mapRow(filled[0]) };
  }

  try {
    const inserted = await db
      .insert(statLineTable)
      .values({
        headerId: input.headerId,
        series: series as number,
        slot: input.slot,
        value: String(input.value),
        source: input.source ?? 'ui',
        stamp,
      })
      .returning();
    await notifyIntegrations(input.headerId, mapRow(inserted[0]), 'upsert');
    return { ok: true, line: mapRow(inserted[0]) };
  } catch (err) {
    // Drizzle wraps query failures in DrizzleQueryError; the underlying Postgres
    // error (constraint name, 'duplicate key') lives on .cause. Walk the chain.
    let msg = err instanceof Error ? err.message : String(err);
    let cause = (err as { cause?: unknown } | null)?.cause;
    let depth = 0;
    while (cause instanceof Error && depth < 5) {
      msg += ' | ' + cause.message;
      cause = (cause as { cause?: unknown } | null)?.cause;
      depth++;
    }
    if (msg.includes('stat_line_header_stamp_unique')) {
      return {
        ok: false,
        code: 'STAMP_TAKEN',
        message: 'A line is already captured for that start datetime stamp.',
      };
    }
    if (msg.includes('stat_line_header_series_slot_unique') || msg.includes('duplicate key')) {
      return {
        ok: false,
        code: 'SLOT_TAKEN',
        message: 'Series ' + series + ' slot ' + input.slot + ' is already captured. Use a different slot or series.',
      };
    }
    return { ok: false, code: 'CAPTURE_FAILED', message: msg };
  }
}

export async function updateStatLineDb(input: {
  headerId: string;
  lineId: string;
  slot?: number;
  value?: number | null;
  source?: string;
}): Promise<CaptureLineResult> {
  const header = await loadStatHeaderConfig(input.headerId);
  if (!header.ok) return header;
  const cfg = header.config;
  const db = getDb();
  const rows = await db
    .select()
    .from(statLineTable)
    .where(and(eq(statLineTable.id, input.lineId), eq(statLineTable.headerId, input.headerId)))
    .limit(1);
  if (!rows.length) {
    return { ok: false, code: 'LINE_NOT_FOUND', message: 'Line not found for this header.' };
  }
  const cur = rows[0];
  const nextSlot = input.slot === undefined ? cur.slot : input.slot;
  if (!Number.isInteger(nextSlot) || nextSlot < 0 || nextSlot >= cfg.frequencyQty) {
    return {
      ok: false,
      code: 'SLOT_OUT_OF_WINDOW',
      message: 'Slot must be an integer within the frequency window (0 to ' + (cfg.frequencyQty - 1) + ').',
    };
  }
  if (nextSlot !== cur.slot) {
    const clash = await db
      .select({ id: statLineTable.id })
      .from(statLineTable)
      .where(
        and(
          eq(statLineTable.headerId, input.headerId),
          eq(statLineTable.series, cur.series),
          eq(statLineTable.slot, nextSlot),
        ),
      )
      .limit(1);
    if (clash.length) {
      return {
        ok: false,
        code: 'SLOT_TAKEN',
        message: 'That frequency value is already seeded on this series.',
      };
    }
  }
  let nextValue: string | null = cur.value == null ? null : String(cur.value);
  if (input.value === null) {
    nextValue = null;
  } else if (input.value !== undefined) {
    if (!Number.isFinite(input.value) || input.value < cfg.scaleStart || input.value > cfg.scaleEnd) {
      return {
        ok: false,
        code: 'VALUE_OUT_OF_SCALE',
        message: 'Value must be within the scale bounds (' + cfg.scaleStart + ' to ' + cfg.scaleEnd + ').',
      };
    }
    nextValue = String(input.value);
  }
  const updated = await db
    .update(statLineTable)
    .set({
      slot: nextSlot,
      value: nextValue,
      source: input.source ?? cur.source,
      capturedAt: nextValue == null ? cur.capturedAt : new Date(),
      updatedAt: new Date(),
      stamp: resolveStamp(cfg, cur.series, nextSlot) ?? cur.stamp,
    })
    .where(eq(statLineTable.id, input.lineId))
    .returning();
  await notifyIntegrations(input.headerId, mapRow(updated[0]), 'upsert');
  return { ok: true, line: mapRow(updated[0]) };
}

/** Recalculate every line stamp from the current header Start + series/slot. */
export async function restampStatLinesForHeader(headerId: string): Promise<void> {
  const header = await loadStatHeaderConfig(headerId);
  if (!header.ok) return;
  const rows = await listStatLinesDb(headerId);
  if (!rows.length) return;
  const db = getDb();
  // Clear first so unique(header, stamp) cannot collide mid-shift.
  await db.update(statLineTable).set({ stamp: null }).where(eq(statLineTable.headerId, headerId));
  for (const ln of rows) {
    const stamp = resolveStamp(header.config, ln.series, ln.slot);
    if (!stamp) continue;
    await db.update(statLineTable).set({ stamp }).where(eq(statLineTable.id, ln.id));
  }
}

export async function deleteStatLineDb(lineId: string): Promise<boolean> {
  const db = getDb();
  const before = await db.select().from(statLineTable).where(eq(statLineTable.id, lineId)).limit(1);
  const deleted = await db
    .delete(statLineTable)
    .where(eq(statLineTable.id, lineId))
    .returning({ id: statLineTable.id });
  if (deleted.length && before.length) await notifyIntegrations(before[0].headerId, mapRow(before[0]), 'delete');
  return deleted.length > 0;
}

/** Re-export for the API route (parse errors surface in one body). */
export { parseStatHeaderConfig };

/**
 * 1.0.14: write values computed from source records (statistics fed from
 * records). `values` is keyed by step index k = (series - 1) * qty + slot.
 * Lines get source 'records'. A line this feed wrote before whose step no
 * longer has a value goes back to empty. Values are stored as computed (no
 * scale check): the graph pins anything above Scale High to the top edge.
 */
export async function writeComputedStatLines(
  headerId: string,
  values: Map<number, number>,
): Promise<{ written: number; cleared: number }> {
  const header = await loadStatHeaderConfig(headerId);
  if (!header.ok) return { written: 0, cleared: 0 };
  const cfg = header.config;
  const qty = cfg.frequencyQty > 0 ? cfg.frequencyQty : 1;
  const db = getDb();
  const rows = await listStatLinesDb(headerId);
  const byKey = new Map(rows.map((ln) => [(ln.series - 1) * qty + ln.slot, ln]));
  let written = 0;
  let cleared = 0;
  for (const [k, value] of values) {
    const series = Math.floor(k / qty) + 1;
    const slot = k % qty;
    const text = String(value);
    const existing = byKey.get(k);
    if (existing) {
      if (existing.value.trim() !== '' && Number(existing.value) === value && existing.source === 'records') continue;
      await db
        .update(statLineTable)
        .set({ value: text, source: 'records', capturedAt: new Date(), updatedAt: new Date() })
        .where(eq(statLineTable.id, existing.id));
    } else {
      await db.insert(statLineTable).values({
        headerId,
        series,
        slot,
        value: text,
        source: 'records',
        stamp: resolveStamp(cfg, series, slot),
      });
    }
    written++;
  }
  for (const [k, ln] of byKey) {
    if (values.has(k) || ln.source !== 'records' || ln.value.trim() === '') continue;
    await db.update(statLineTable).set({ value: null, updatedAt: new Date() }).where(eq(statLineTable.id, ln.id));
    cleared++;
  }
  if (written || cleared) {
    const changedSince = new Date(Date.now() - 5_000);
    for (const ln of await listStatLinesDb(headerId)) {
      if (ln.updated_at && Date.parse(ln.updated_at) >= changedSince.getTime()) await notifyIntegrations(headerId, ln, 'upsert');
    }
  }
  return { written, cleared };
}

/**
 * 1.0.20: tell the integration queue a graph line changed (state_integrations.md §3.5).
 * Never fails the write: a queue problem is logged.
 */
async function notifyIntegrations(headerId: string, line: StatLineRow, action: 'upsert' | 'delete'): Promise<void> {
  try {
    const { queueStatLineChange } = await import('@/lib/integrations/queue');
    await queueStatLineChange(headerId, line, action);
  } catch (err) {
    console.warn('Integration queue (graph line) failed:', err);
  }
}

/**
 * 1.0.20: write a received graph line by (series, slot), without the capture checks
 * (statistics rules S3, S5, state_integrations.md §4). `value` null keeps the line and
 * clears nothing; `source` marks where it came from ('integration', 'integration-deleted').
 */
export async function upsertStatLineDb(input: {
  headerId: string;
  series: number;
  slot: number;
  value: string | null;
  source: string;
  keepValue?: boolean;
}): Promise<StatLineRow> {
  const header = await loadStatHeaderConfig(input.headerId);
  const stamp = header.ok ? resolveStamp(header.config, input.series, input.slot) : null;
  const db = getDb();
  const existing = await db
    .select()
    .from(statLineTable)
    .where(and(eq(statLineTable.headerId, input.headerId), eq(statLineTable.series, input.series), eq(statLineTable.slot, input.slot)))
    .limit(1);
  if (existing.length) {
    // A line kept after a delete at the source is not emptied by a later empty value (S8).
    if (!input.keepValue && input.value === null && existing[0].source === 'integration-deleted') return mapRow(existing[0]);
    const updated = await db
      .update(statLineTable)
      .set({
        ...(input.keepValue ? {} : { value: input.value, capturedAt: new Date() }),
        source: input.source,
        updatedAt: new Date(),
        stamp: stamp ?? existing[0].stamp,
      })
      .where(eq(statLineTable.id, existing[0].id))
      .returning();
    return mapRow(updated[0]);
  }
  const inserted = await db
    .insert(statLineTable)
    .values({ headerId: input.headerId, series: input.series, slot: input.slot, value: input.value, source: input.source, stamp })
    .returning();
  return mapRow(inserted[0]);
}

/** 1.0.20: lines of a header changed on or after `since` (integration pulls). */
export async function listStatLinesChangedSince(headerId: string, since: Date | null): Promise<StatLineRow[]> {
  const rows = await listStatLinesDb(headerId);
  if (!since) return rows;
  return rows.filter((ln) => ln.updated_at && Date.parse(ln.updated_at) >= since.getTime());
}

/** 1.0.20: the date a (series, slot) falls on for a header, as the receiver checks it (S2). */
export async function stampFor(headerId: string, series: number, slot: number): Promise<string | null> {
  const header = await loadStatHeaderConfig(headerId);
  if (!header.ok) return null;
  return resolveStamp(header.config, series, slot)?.toISOString() ?? null;
}
