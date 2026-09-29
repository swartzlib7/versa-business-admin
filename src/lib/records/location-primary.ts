/** One Location per Organization may have Primary address on. */

export function isPrimaryAddress(value: unknown): boolean {
  if (value === true) return true;
  return typeof value === "string" && /^(true|1|yes)$/i.test(value.trim());
}

/** The Organization this Location belongs to. The lookup wins; otherwise the record's org. */
export function locationOrgKey(
  data: Record<string, unknown> | undefined,
  recordOrgId: string,
): string {
  const linked = data?.organization_id;
  if (typeof linked === "string" && linked.trim()) return linked.trim();
  return recordOrgId;
}

export function siblingPrimaryIds(
  rows: Array<{ id: string; org_id?: string; data?: Record<string, unknown> }>,
  keepId: string,
  orgKey: string,
): string[] {
  if (!orgKey) return [];
  return rows
    .filter((row) => row.id !== keepId)
    .filter((row) => locationOrgKey(row.data, row.org_id ?? "") === orgKey)
    .filter((row) => isPrimaryAddress(row.data?.is_primary))
    .map((row) => row.id);
}
