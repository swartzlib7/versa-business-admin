import '@/lib/catalog/install-durable';
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
 * - record_relations write paths land with #249 Slice E2 (executive
 *   one-to-many to organizations + record targets); organization-attached
 *   lines (C3 design note) stay schema-ready for the Slice F cutover.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getDb } from './client';
import {
  organizations as organizationsTable,
  record as recordTable,
  recordLine as recordLineTable,
  recordRelations as recordRelationsTable,
  recordType as recordTypeTable,
  users as usersTable,
} from './schema';
import { recordTypes } from '@/lib/fixtures/record-types';
import { listFieldDefinitions } from '@/lib/fixtures/catalog';
import type {
  CreateInstanceInput,
  CreateInstanceResult,
  RecordInstance,
  RecordInstanceLine,
  RecordInstanceRelation,
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

/**
 * #249 Slice E2 (rev E section 3.2): load outbound relations for a batch of
 * records. Target display names are resolved in the same pass (record header
 * name or organization name) so the UI renders navigation without a second
 * fetch per relation.
 */
async function loadRelations(
  recordIds: string[],
): Promise<Map<string, RecordInstanceRelation[]>> {
  const map = new Map<string, RecordInstanceRelation[]>();
  if (!recordIds.length) return map;
  const db = getDb();
  const rows = await db
    .select({
      id: recordRelationsTable.id,
      sourceRecordId: recordRelationsTable.sourceRecordId,
      targetRecordId: recordRelationsTable.targetRecordId,
      targetOrganizationId: recordRelationsTable.targetOrganizationId,
      relationKind: recordRelationsTable.relationKind,
    })
    .from(recordRelationsTable)
    .where(inArray(recordRelationsTable.sourceRecordId, recordIds))
    .orderBy(recordRelationsTable.createdAt);
  if (!rows.length) return map;
  // Batch-resolve target display names (records carry name in header JSONB).
  const recordTargetIds = [
    ...new Set(rows.map((r) => r.targetRecordId).filter((v): v is string => !!v)),
  ];
  const orgTargetIds = [
    ...new Set(
      rows.map((r) => r.targetOrganizationId).filter((v): v is string => !!v),
    ),
  ];
  const recordNames = new Map<string, string>();
  if (recordTargetIds.length) {
    const recRows = await db
      .select({ id: recordTable.id, header: recordTable.header })
      .from(recordTable)
      .where(inArray(recordTable.id, recordTargetIds));
    for (const rec of recRows) {
      const header = headerToStrings(rec.header);
      recordNames.set(rec.id, header.name ?? header.Name ?? rec.id);
    }
  }
  const orgNames = new Map<string, string>();
  if (orgTargetIds.length) {
    const orgRows = await db
      .select({ id: organizationsTable.id, name: organizationsTable.name })
      .from(organizationsTable)
      .where(inArray(organizationsTable.id, orgTargetIds));
    for (const org of orgRows) orgNames.set(org.id, org.name);
  }
  for (const r of rows) {
    if (!r.sourceRecordId) continue;
    const list = map.get(r.sourceRecordId) ?? [];
    if (r.targetRecordId) {
      list.push({
        id: r.id,
        record_id: r.sourceRecordId,
        target_record_id: r.targetRecordId,
        target_name: recordNames.get(r.targetRecordId) ?? r.targetRecordId,
        target_kind: 'record',
        relation_kind: r.relationKind,
      });
    } else if (r.targetOrganizationId) {
      list.push({
        id: r.id,
        record_id: r.sourceRecordId,
        target_organization_id: r.targetOrganizationId,
        target_name: orgNames.get(r.targetOrganizationId) ?? r.targetOrganizationId,
        target_kind: 'organization',
        relation_kind: r.relationKind,
      });
    }
    map.set(r.sourceRecordId, list);
  }
  return map;
}

function toInstance(
  row: typeof recordTable.$inferSelect,
  type: typeof recordTypeTable.$inferSelect,
  lines: RecordInstanceLine[],
  relations: RecordInstanceRelation[] = [],
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
    relations: relations.length ? relations : undefined,
    org_id: row.orgId,
    created_at: row.createdAt.toISOString(),
  };
}

/**
 * Organization auto-preset: explicit org_id, else the Primary Org, else the type tenant root.
 */
async function resolveOrgIdForCreate(
  explicitOrgId: string | undefined,
  createdBy: string | null,
  typeOrgId: string,
): Promise<{ ok: true; orgId: string } | { ok: false; code: string; message: string }> {
  const db = getDb();
  if (explicitOrgId) {
    const rows = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, explicitOrgId))
      .limit(1);
    if (!rows.length)
      return {
        ok: false,
        code: 'ORG_NOT_FOUND',
        message: 'org_id does not reference an existing organization.',
      };
    return { ok: true, orgId: explicitOrgId };
  }
  const orgs = await db.select().from(organizationsTable);
  const primary =
    orgs.find((row) => (row.data as Record<string, unknown> | null)?.is_primary === true) ??
    orgs.find((row) => row.orgType === "internal");
  if (primary) return { ok: true, orgId: primary.id };
  void createdBy;
  return { ok: true, orgId: typeOrgId };
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
  const ids = rows.map((r) => r.record.id);
  const linesMap = await loadLines(ids);
  const relationsMap = await loadRelations(ids);
  return rows.map((r) =>
    toInstance(
      r.record,
      r.type,
      linesMap.get(r.record.id) ?? [],
      relationsMap.get(r.record.id) ?? [],
    ),
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
  const relationsMap = await loadRelations([id]);
  return toInstance(
    rows[0].record,
    rows[0].type,
    linesMap.get(id) ?? [],
    relationsMap.get(id) ?? [],
  );
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

  const orgResolved = await resolveOrgIdForCreate(
    input.org_id,
    opts?.createdBy ?? null,
    type.orgId,
  );
  if (!orgResolved.ok) {
    return { ok: false, code: orgResolved.code, message: orgResolved.message };
  }

  const header: Record<string, string> = { ...(input.data ?? {}) };
  header.name = input.name.trim();
  header.status = input.status || 'active';

  const stableId = input.id?.trim();
  let recordId: string;
  try {
    const inserted = await db
      .insert(recordTable)
      .values({
        ...(stableId ? { id: stableId } : {}),
        orgId: orgResolved.orgId,
        recordTypeId: type.id,
        header,
        createdBy: opts?.createdBy ?? null,
      })
      .returning({ id: recordTable.id });
    recordId = inserted[0].id;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (stableId && /unique|duplicate/i.test(msg)) {
      return { ok: false, code: 'ID_EXISTS', message: `Instance '${stableId}' already exists.` };
    }
    throw e;
  }

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

  // #249 Slice E2 (rev E section 3.2): executive one-to-many relations.
  // Exactly one of record_id / organization_id per relation row (CHECK).
  const relations = input.relations ?? [];
  if (relations.length) {
    for (const rel of relations) {
      if (rel.record_id) {
        await db.insert(recordRelationsTable).values({
          orgId: orgResolved.orgId,
          sourceRecordId: recordId,
          targetRecordId: rel.record_id,
          relationKind: rel.relation_kind ?? 'related',
        });
      } else if (rel.organization_id) {
        await db.insert(recordRelationsTable).values({
          orgId: orgResolved.orgId,
          sourceRecordId: recordId,
          targetOrganizationId: rel.organization_id,
          relationKind: rel.relation_kind ?? 'related',
        });
      }
    }
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

  // #249 Slice E2 (rev E section 2.5): org field is user-changeable per record.
  // Validate the target organization exists before moving the record.
  let orgUpdate: { orgId: string } | undefined;
  if (input.org_id !== undefined) {
    if (!input.org_id.trim()) {
      return {
        ok: false,
        code: 'ORG_REQUIRED',
        message: 'org_id cannot be empty; omit it to keep the current organization.',
      };
    }
    const orgRows = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, input.org_id.trim()))
      .limit(1);
    if (!orgRows.length) {
      return {
        ok: false,
        code: 'ORG_NOT_FOUND',
        message: 'org_id does not reference an existing organization.',
      };
    }
    orgUpdate = { orgId: orgRows[0].id };
  }

  await db
    .update(recordTable)
    .set({
      header: nextHeader,
      updatedAt: new Date(),
      ...(orgUpdate ? { orgId: orgUpdate.orgId } : {}),
    })
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

  // #249 Slice E2: relations replace-in-full (same fixture semantics as lines).
  if (input.relations !== undefined) {
    await db
      .delete(recordRelationsTable)
      .where(eq(recordRelationsTable.sourceRecordId, id));
    for (const rel of input.relations) {
      if (rel.record_id) {
        await db.insert(recordRelationsTable).values({
          orgId: cur[0].orgId,
          sourceRecordId: id,
          targetRecordId: rel.record_id,
          relationKind: rel.relation_kind ?? 'related',
        });
      } else if (rel.organization_id) {
        await db.insert(recordRelationsTable).values({
          orgId: cur[0].orgId,
          sourceRecordId: id,
          targetOrganizationId: rel.organization_id,
          relationKind: rel.relation_kind ?? 'related',
        });
      }
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

// ---------------------------------------------------------------------------
// #244 Slice F (D1 cutover): organization-attached lines (C3 design note).
// Vendor integrations are record_line rows attached to the parent vendor
// organization (record_line.organization_id + line_group='integrations'); the
// vendor_integration record type is retired (seed removed this slice,
// migration 0004 migrates any existing rows). The E1 XOR CHECK
// (record_line_parent_check) guarantees exactly one of record_id /
// organization_id per row, so org-attached lines never collide with
// record-attached lines.
// ---------------------------------------------------------------------------

export interface OrgLineRow {
  id: string;
  organization_id: string;
  line_group: string;
  data: Record<string, string>;
  sort_order: number;
}

function mapOrgLineRow(ln: typeof recordLineTable.$inferSelect): OrgLineRow {
  return {
    id: ln.id,
    organization_id: ln.organizationId ?? '',
    line_group: ln.lineGroup ?? '',
    data: (ln.data ?? {}) as Record<string, string>,
    sort_order: ln.position,
  };
}

export async function listOrgLinesDb(
  organizationId: string,
  lineGroup: string,
): Promise<OrgLineRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(recordLineTable)
    .where(
      and(
        eq(recordLineTable.organizationId, organizationId),
        eq(recordLineTable.lineGroup, lineGroup),
      ),
    )
    .orderBy(recordLineTable.position, recordLineTable.createdAt);
  return rows.map(mapOrgLineRow);
}

export async function createOrgLineDb(
  organizationId: string,
  lineGroup: string,
  data: Record<string, string>,
): Promise<{ ok: true; line: OrgLineRow } | { ok: false; code: string; message: string }> {
  const db = getDb();
  const org = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId))
    .limit(1);
  if (!org.length) {
    return { ok: false, code: 'ORG_NOT_FOUND', message: 'Organization not found.' };
  }
  const next = await db
    .select({ m: sql`coalesce(max(${recordLineTable.position}), -1) + 1` })
    .from(recordLineTable)
    .where(
      and(
        eq(recordLineTable.organizationId, organizationId),
        eq(recordLineTable.lineGroup, lineGroup),
      ),
    );
  const inserted = await db
    .insert(recordLineTable)
    .values({
      organizationId,
      lineGroup,
      position: Number(next[0]?.m ?? 0),
      data,
    })
    .returning();
  return { ok: true, line: mapOrgLineRow(inserted[0]) };
}

export async function updateOrgLineDb(
  organizationId: string,
  lineId: string,
  lineGroup: string,
  data: Record<string, string>,
): Promise<{ ok: true; line: OrgLineRow } | { ok: false; code: string; message: string }> {
  const db = getDb();
  const updated = await db
    .update(recordLineTable)
    .set({ data, updatedAt: new Date() })
    .where(
      and(
        eq(recordLineTable.id, lineId),
        eq(recordLineTable.organizationId, organizationId),
        eq(recordLineTable.lineGroup, lineGroup),
      ),
    )
    .returning();
  if (!updated.length) {
    return { ok: false, code: 'NOT_FOUND', message: 'Line not found.' };
  }
  return { ok: true, line: mapOrgLineRow(updated[0]) };
}

export async function deleteOrgLineDb(
  organizationId: string,
  lineId: string,
  lineGroup: string,
): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(recordLineTable)
    .where(
      and(
        eq(recordLineTable.id, lineId),
        eq(recordLineTable.organizationId, organizationId),
        eq(recordLineTable.lineGroup, lineGroup),
      ),
    )
    .returning({ id: recordLineTable.id });
  return deleted.length > 0;
}
