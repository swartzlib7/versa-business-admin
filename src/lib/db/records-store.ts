/**
 * #245 Slice E1 - Horizon 1 core persistence (rev E section 4.2).
 * record_type / record / record_line persistence behind DATA_SOURCE=postgres.
 *
 * Contract notes:
 * - The fixture registry (src/lib/fixtures/record-types.ts) stays the type
 *   source of truth this slice; record_type rows mirror it (system types are
 *   migrated here, custom types register lazily on first record write).
 * - record.header JSONB carries the field values; name/status are kept in the
 *   header so the fixture-shaped API contract maps 1:1.
 * - Lines persist in record_line (structural, always cascade). line_group is
 *   the lines-group api_name; NULL reads as the legacy default group and is
 *   backfilled to the type's first group per COA note 3827 (Horizon 1 note
 *   from Slice A Gate 2) so fixture-era rows never split-group on read.
 * - record_relations + organization-attached lines (C3 design note) are
 *   schema-ready; their write paths arrive with E2/F.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getDb } from './client';
import {
  organizations as organizationsTable,
  record as recordTable,
  recordLine as recordLineTable,
  recordType as recordTypeTable,
} from './schema';
import { recordTypes } from '@/lib/fixtures/record-types';
import { listFieldDefinitions } from '@/lib/fixtures/catalog';
import type {
  CreateInstanceInput,
  CreateInstanceResult,
  RecordInstance,
  RecordInstanceLine,
  UpdateInstanceInput,
  UpdateInstanceResult,
} from '@/lib/fixtures/record-instances';

type Header = Record<string, unknown>;

function headerToStrings(header: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (header && typeof header === 'object' && !Array.isArray(header)) {
    for (const [k, v] of Object.entries(header as Header)) {
      if (v == null) continue;
      out[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  return out;
}

/**
 * First lines-group api_name for a header_lines type (Slice A convention):
 * first list-zone field's api_name prefix + 's'; prefix 'line' keeps the
 * legacy default group (NULL). Mirrors zone-config-view linesGroupApiName.
 */
function firstLinesGroupForType(typeApiName: string): string | null {
  const defs = listFieldDefinitions(typeApiName);
  const firstList = defs.find((f) => f.zone_role === 'list');
  if (!firstList) return null;
  const prefix = firstList.api_name.split('_')[0];
  return prefix === 'line' ? null : prefix + 's';
}

/**
 * Migrate seeded system types into record_type rows (rev E section 4.2) and
 * register any known fixture type missing from the table (custom types created
 * via the Records Editor register lazily on first record write). Idempotent:
 * inserts missing rows, updates rows that drifted from the fixture registry.
 */
export async function ensureRecordTypesFromRegistry(): Promise<void> {
  const db = getDb();
  const orgRows = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .limit(1);
  const orgId = orgRows[0]?.id;
  if (!orgId) return; // no tenant org yet - nothing to attach types to

  const existing = await db.select().from(recordTypeTable);
  const byApiName = new Map(existing.map((r) => [r.apiName, r]));

  for (const t of recordTypes) {
    if (!t.active) continue;
    const cur = byApiName.get(t.api_name);
    if (!cur) {
      await db.insert(recordTypeTable).values({
        id: t.id,
        orgId,
        apiName: t.api_name,
        label: t.label,
        parentKind: t.parent_kind,
        parentApiName: t.parent_api_name,
        structure: t.structure,
        isSystem: t.is_system,
      });
    } else if (
      cur.label !== t.label ||
      cur.parentKind !== t.parent_kind ||
      cur.parentApiName !== t.parent_api_name ||
      cur.structure !== t.structure ||
      cur.isSystem !== t.is_system
    ) {
      await db
        .update(recordTypeTable)
        .set({
          label: t.label,
          parentKind: t.parent_kind,
          parentApiName: t.parent_api_name,
          structure: t.structure,
          isSystem: t.is_system,
          updatedAt: new Date(),
        })
        .where(eq(recordTypeTable.id, cur.id));
    }
  }
}

/**
 * COA note 3827 backfill: fixture-era lines carry no line_group (NULL reads as
 * the default group). Stamp NULL-group lines under each header_lines type's
 * records with that type's first lines group so reads never split-group.
 */
export async function backfillDefaultLineGroups(): Promise<void> {
  const db = getDb();
  const types = await db.select().from(recordTypeTable);
  for (const t of types) {
    if (t.structure !== 'header_lines') continue;
    const group = firstLinesGroupForType(t.apiName);
    if (!group) continue; // legacy default group stays NULL (policy)
    await db.execute(sql`
      UPDATE record_line SET line_group = ${group}, updated_at = now()
      WHERE line_group IS NULL
        AND record_id IN (SELECT id FROM record WHERE record_type_id = ${t.id})
    `);
  }
}

async function loadLines(recordIds: string[]): Promise<Map<string, RecordInstanceLine[]>> {
  const map = new Map<string, RecordInstanceLine[]>();
  if (!recordIds.length) return map;
  const db = getDb();
  const rows = await db
    .select()
    .from(recordLineTable)
    .where(inArray(recordLineTable.recordId, recordIds))
    .orderBy(recordLineTable.position, recordLineTable.createdAt);
  for (const ln of rows) {
    if (!ln.recordId) continue;
    const list = map.get(ln.recordId) ?? [];
    list.push({
      id: ln.id,
      record_id: ln.recordId,
      line_group: ln.lineGroup ?? undefined,
      data: (ln.data ?? {}) as Record<string, string>,
      sort_order: ln.position,
    });
    map.set(ln.recordId, list);
  }
  return map;
}

function toInstance(
  row: typeof recordTable.$inferSelect,
  type: typeof recordTypeTable.$inferSelect,
  lines: RecordInstanceLine[],
): RecordInstance {
  const header = headerToStrings(row.header);
  const name = header.name ?? header.Name ?? '';
  const status = header.status ?? header.Status ?? 'active';
  return {
    id: row.id,
    type_api_name: type.apiName,
    parent_kind: type.parentKind,
    parent_api_name: type.parentApiName,
    name,
    status,
    data: header,
    lines: lines.length ? lines : undefined,
    created_at: row.createdAt.toISOString(),
  };
}

export type DbRecordFilters = {
  type_api_name?: string;
  parent_kind?: string;
  parent_api_name?: string;
};

export async function listRecordsDb(
  filters: DbRecordFilters,
): Promise<RecordInstance[]> {
  await ensureRecordTypesFromRegistry();
  await backfillDefaultLineGroups();
  const db = getDb();
  const conds = [];
  if (filters.type_api_name)
    conds.push(eq(recordTypeTable.apiName, filters.type_api_name));
  if (filters.parent_kind)
    conds.push(eq(recordTypeTable.parentKind, filters.parent_kind));
  if (filters.parent_api_name)
    conds.push(eq(recordTypeTable.parentApiName, filters.parent_api_name));
  const rows = await db
    .select({ record: recordTable, type: recordTypeTable })
    .from(recordTable)
    .innerJoin(recordTypeTable, eq(recordTable.recordTypeId, recordTypeTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(recordTable.createdAt);
  const linesMap = await loadLines(rows.map((r) => r.record.id));
  return rows.map((r) =>
    toInstance(r.record, r.type, linesMap.get(r.record.id) ?? []),
  );
}

export async function getRecordDb(id: string): Promise<RecordInstance | null> {
  await ensureRecordTypesFromRegistry();
  await backfillDefaultLineGroups();
  const db = getDb();
  const rows = await db
    .select({ record: recordTable, type: recordTypeTable })
    .from(recordTable)
    .innerJoin(recordTypeTable, eq(recordTable.recordTypeId, recordTypeTable.id))
    .where(eq(recordTable.id, id))
    .limit(1);
  if (!rows.length) return null;
  const linesMap = await loadLines([id]);
  return toInstance(rows[0].record, rows[0].type, linesMap.get(id) ?? []);
}

export async function createRecordDb(
  input: CreateInstanceInput,
  opts?: { createdBy?: string | null },
): Promise<CreateInstanceResult> {
  if (!input.type_api_name?.trim())
    return { ok: false, code: 'TYPE_REQUIRED', message: 'type_api_name is required.' };
  if (!input.parent_kind?.trim())
    return { ok: false, code: 'PARENT_KIND_REQUIRED', message: 'parent_kind is required.' };
  if (!input.parent_api_name?.trim())
    return { ok: false, code: 'PARENT_REQUIRED', message: 'parent_api_name is required.' };
  if (!input.name?.trim())
    return { ok: false, code: 'NAME_REQUIRED', message: 'name is required.' };

  await ensureRecordTypesFromRegistry();
  const db = getDb();
  const typeRows = await db
    .select()
    .from(recordTypeTable)
    .where(eq(recordTypeTable.apiName, input.type_api_name.trim()))
    .limit(1);
  const type = typeRows[0];
  if (!type)
    return {
      ok: false,
      code: 'TYPE_NOT_FOUND',
      message: `Record type '${input.type_api_name}' is not registered.`,
    };

  const header: Record<string, string> = { ...(input.data ?? {}) };
  header.name = input.name.trim();
  header.status = input.status || 'active';

  const inserted = await db
    .insert(recordTable)
    .values({
      orgId: type.orgId,
      recordTypeId: type.id,
      header,
      createdBy: opts?.createdBy ?? null,
    })
    .returning({ id: recordTable.id });
  const recordId = inserted[0].id;

  const lines = input.lines ?? [];
  if (lines.length) {
    await db.insert(recordLineTable).values(
      lines.map((lineData, idx) => ({
        recordId,
        lineGroup: lineData.line_group ?? null,
        position: (idx + 1) * 10,
        data: lineData.data,
      })),
    );
  }

  const instance = await getRecordDb(recordId);
  return instance
    ? { ok: true, instance }
    : { ok: false, code: 'CREATE_FAILED', message: 'Record insert did not return a row.' };
}

export async function updateRecordDb(
  id: string,
  input: UpdateInstanceInput,
): Promise<UpdateInstanceResult> {
  await ensureRecordTypesFromRegistry();
  const db = getDb();
  const cur = await db.select().from(recordTable).where(eq(recordTable.id, id)).limit(1);
  if (!cur.length)
    return { ok: false, code: 'NOT_FOUND', message: `Instance '${id}' not found.` };

  const curHeader = headerToStrings(cur[0].header);
  const nextHeader: Record<string, string> = { ...curHeader };
  if (input.data !== undefined) {
    // Fixture semantics: data replaces wholesale; name/status re-stamped below.
    for (const k of Object.keys(nextHeader)) {
      if (k !== 'name' && k !== 'Name' && k !== 'status' && k !== 'Status') delete nextHeader[k];
    }
    Object.assign(nextHeader, input.data);
  }
  if (input.name !== undefined) nextHeader.name = input.name.trim();
  if (input.status !== undefined) nextHeader.status = input.status;

  await db
    .update(recordTable)
    .set({ header: nextHeader, updatedAt: new Date() })
    .where(eq(recordTable.id, id));

  if (input.lines !== undefined) {
    // Fixture semantics: the lines array replaces in full.
    await db.delete(recordLineTable).where(eq(recordLineTable.recordId, id));
    if (input.lines.length) {
      await db.insert(recordLineTable).values(
        input.lines.map((lineData, idx) => ({
          recordId: id,
          lineGroup: lineData.line_group ?? null,
          position: (idx + 1) * 10,
          data: lineData.data,
        })),
      );
    }
  }

  const instance = await getRecordDb(id);
  return instance
    ? { ok: true, instance }
    : { ok: false, code: 'UPDATE_FAILED', message: 'Record update did not return a row.' };
}

export async function deleteRecordDb(id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(recordTable)
    .where(eq(recordTable.id, id))
    .returning({ id: recordTable.id });
  return deleted.length > 0;
}
