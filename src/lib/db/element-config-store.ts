/**
 * #249 Slice E2 - element_config persistence (rev E section 4.5, section 2.6).
 * Division configuration singleton per organization + element_api_name:
 * the appointed staff member in charge of the division and their deputy,
 * plus division-specific configuration JSONB. Replaces the rev-C faculty
 * Configuration forms (section 7.9).
 */

import { and, eq } from 'drizzle-orm';
import { getDb } from './client';
import { elementConfig as elementConfigTable, organizations as organizationsTable } from './schema';

export interface ElementConfigShape {
  element_api_name: string;
  head_user_id: string | null;
  deputy_user_id: string | null;
  config: Record<string, unknown>;
}

async function resolveOrgId(): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function getElementConfigDb(
  elementApiName: string,
): Promise<ElementConfigShape | null> {
  const db = getDb();
  const orgId = await resolveOrgId();
  if (!orgId) return null;
  const rows = await db
    .select()
    .from(elementConfigTable)
    .where(
      and(
        eq(elementConfigTable.orgId, orgId),
        eq(elementConfigTable.elementApiName, elementApiName),
      ),
    )
    .limit(1);
  if (!rows.length) return null;
  const row = rows[0];
  return {
    element_api_name: row.elementApiName,
    head_user_id: row.headUserId ?? null,
    deputy_user_id: row.deputyUserId ?? null,
    config: (row.config ?? {}) as Record<string, unknown>,
  };
}

export interface UpsertElementConfigInput {
  head_user_id?: string | null;
  deputy_user_id?: string | null;
  config?: Record<string, unknown>;
}

export async function upsertElementConfigDb(
  elementApiName: string,
  input: UpsertElementConfigInput,
): Promise<ElementConfigShape> {
  const db = getDb();
  const orgId = await resolveOrgId();
  if (!orgId) throw new Error('NO_ORGANIZATION: no tenant organization exists.');
  const existing = await getElementConfigDb(elementApiName);
  if (existing) {
    await db
      .update(elementConfigTable)
      .set({
        headUserId: input.head_user_id ?? existing.head_user_id,
        deputyUserId: input.deputy_user_id ?? existing.deputy_user_id,
        config: input.config ?? existing.config,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(elementConfigTable.orgId, orgId),
          eq(elementConfigTable.elementApiName, elementApiName),
        ),
      );
  } else {
    await db.insert(elementConfigTable).values({
      orgId,
      elementApiName,
      headUserId: input.head_user_id ?? null,
      deputyUserId: input.deputy_user_id ?? null,
      config: input.config ?? {},
    });
  }
  const next = await getElementConfigDb(elementApiName);
  if (!next) throw new Error('UPSERT_FAILED: element_config row missing after write.');
  return next;
}
