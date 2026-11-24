/**
 * The plain value of a record's secret field, for server code only
 * (1.0.18, state_integrations.md §3.4). API reads mask these fields.
 */
import { isPostgresDataSource } from "@/lib/db/data-source";
import { getInstance } from "@/lib/fixtures/record-instances";

export async function readRecordSecret(recordId: string, field: string): Promise<string | null> {
  if (!recordId) return null;
  if (isPostgresDataSource()) {
    const { readRecordSecretDb } = await import("@/lib/db/records-store");
    return readRecordSecretDb(recordId, field);
  }
  // Fixture mode (opt-in, in memory) keeps values as written.
  const value = getInstance(recordId)?.data?.[field];
  return typeof value === "string" ? value : value == null ? null : JSON.stringify(value);
}
