import { NextResponse } from 'next/server';
import { eq, inArray, or } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import {
  organizations as organizationsTable,
  record as recordTable,
  recordRelations as recordRelationsTable,
  recordType as recordTypeTable,
} from '@/lib/db/schema';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';

// #249 Slice E2 (rev E section 3.2): both-way relation navigation. Returns
// outbound relations (this record -> targets) and inbound relations
// (sources -> this record), with resolved display names and record type
// labels so the UI renders navigation without extra fetches.

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  const db = getDb();

  const rows = await db
    .select()
    .from(recordRelationsTable)
    .where(
      or(
        eq(recordRelationsTable.sourceRecordId, id),
        eq(recordRelationsTable.targetRecordId, id),
      ),
    )
    .orderBy(recordRelationsTable.createdAt);

  // Batch-resolve record sources/targets (name + type label from header JSONB).
  const recordIds = [
    ...new Set(
      rows.flatMap((r) =>
        [r.sourceRecordId, r.targetRecordId].filter(
          (v): v is string => !!v && v !== id,
        ),
      ),
    ),
  ];
  const recordInfo = new Map<string, { name: string; type_label: string }>();
  if (recordIds.length) {
    const recRows = await db
      .select({
        id: recordTable.id,
        header: recordTable.header,
        typeApiName: recordTypeTable.apiName,
        typeLabel: recordTypeTable.label,
      })
      .from(recordTable)
      .innerJoin(
        recordTypeTable,
        eq(recordTable.recordTypeId, recordTypeTable.id),
      )
      .where(inArray(recordTable.id, recordIds));
    for (const rec of recRows) {
      const header = (rec.header ?? {}) as Record<string, unknown>;
      const name =
        typeof header.name === 'string'
          ? header.name
          : typeof header.Name === 'string'
            ? header.Name
            : rec.id;
      recordInfo.set(rec.id, {
        name,
        type_label: rec.typeLabel || rec.typeApiName,
      });
    }
  }

  const orgIds = [
    ...new Set(
      rows
        .map((r) => r.targetOrganizationId)
        .filter((v): v is string => !!v),
    ),
  ];
  const orgInfo = new Map<string, string>();
  if (orgIds.length) {
    const orgRows = await db
      .select({ id: organizationsTable.id, name: organizationsTable.name })
      .from(organizationsTable)
      .where(inArray(organizationsTable.id, orgIds));
    for (const org of orgRows) orgInfo.set(org.id, org.name);
  }

  const outbound = rows
    .filter((r) => r.sourceRecordId === id)
    .map((r) =>
      r.targetRecordId
        ? {
            id: r.id,
            direction: 'outbound' as const,
            target_record_id: r.targetRecordId,
            target_name:
              recordInfo.get(r.targetRecordId)?.name ?? r.targetRecordId,
            target_type_label: recordInfo.get(r.targetRecordId)?.type_label,
            target_kind: 'record' as const,
            relation_kind: r.relationKind,
          }
        : {
            id: r.id,
            direction: 'outbound' as const,
            target_organization_id: r.targetOrganizationId ?? '',
            target_name:
              orgInfo.get(r.targetOrganizationId ?? '') ??
              r.targetOrganizationId ??
              '',
            target_kind: 'organization' as const,
            relation_kind: r.relationKind,
          },
    );
  const inbound = rows
    .filter((r) => r.targetRecordId === id)
    .map((r) => ({
      id: r.id,
      direction: 'inbound' as const,
      source_record_id: r.sourceRecordId,
      source_name: recordInfo.get(r.sourceRecordId)?.name ?? r.sourceRecordId,
      source_type_label: recordInfo.get(r.sourceRecordId)?.type_label,
      relation_kind: r.relationKind,
    }));

  return NextResponse.json({ data: { outbound, inbound } });
}
