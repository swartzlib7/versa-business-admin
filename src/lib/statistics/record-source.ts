/**
 * Statistics fed from records (1.0.14), server side. After a record of type T
 * changes, every statistic whose Source record type is T is recomputed and its
 * values written (stat-lines-store writeComputedStatLines). Statistics need
 * Postgres; in fixture mode this is a no-op.
 */
import { adapter } from "@/lib/data/adapter";
import { foldRecordTypeApiName } from "@/lib/catalog/name-aliases";
import { parseStatHeaderConfig } from "@/lib/statistics/model";
import { computeSourceSteps, statSourceFromData, withRecordFields } from "@/lib/statistics/source-values";
import { writeComputedStatLines } from "@/lib/db/stat-lines-store";

type Header = { id: string; data?: Record<string, unknown> };

async function sourceLines(
  recordType: string,
  recordId: string | null,
  readFrom: "lines" | "records" = "lines",
): Promise<Array<Record<string, unknown>>> {
  if (readFrom === "records") {
    // 1.0.15: each record counts once, with its own (header) fields.
    const all = adapter.listRecords ? await adapter.listRecords({ type_api_name: recordType }) : [];
    return all.map((record) => ({ ...(record.data ?? {}), name: record.name, status: record.data?.status ?? record.status }));
  }
  if (recordId) {
    const one = adapter.getRecord ? await adapter.getRecord(recordId) : null;
    if (!one || foldRecordTypeApiName(one.type_api_name) !== foldRecordTypeApiName(recordType)) return [];
    return withRecordFields([one]);
  }
  const all = adapter.listRecords ? await adapter.listRecords({ type_api_name: recordType }) : [];
  return withRecordFields(all);
}

async function refreshHeader(header: Header): Promise<{ written: number; cleared: number } | null> {
  const data = header.data ?? {};
  const source = statSourceFromData(data);
  if (!source) return null;
  const { installTimeZone } = await import("@/lib/settings/install-time-zone");
  const parsed = parseStatHeaderConfig(data, installTimeZone());
  if (!parsed.ok) return null;
  const lines = await sourceLines(source.recordType, source.recordId, source.readFrom);
  return writeComputedStatLines(header.id, computeSourceSteps(parsed.config, source, lines));
}

/** Recompute one statistic from its source. null when it has no source (or no DB). */
export async function refreshStatisticFromSource(headerId: string): Promise<{ written: number; cleared: number } | null> {
  if (!adapter.getRecord) return null;
  try {
    const header = await adapter.getRecord(headerId);
    if (!header || foldRecordTypeApiName(header.type_api_name) !== "statistics") return null;
    return await refreshHeader(header);
  } catch (err) {
    console.warn("Statistic source refresh failed", headerId, err);
    return null;
  }
}

/** Recompute every statistic fed by this record type. Errors are logged, never thrown. */
export async function refreshStatisticsFedBy(typeApiName: string): Promise<void> {
  if (!adapter.listRecords) return;
  const type = foldRecordTypeApiName(typeApiName);
  if (type === "statistics") return;
  try {
    const headers = await adapter.listRecords({ type_api_name: "statistics" });
    for (const header of headers) {
      const source = statSourceFromData(header.data ?? {});
      if (!source || foldRecordTypeApiName(source.recordType) !== type) continue;
      await refreshHeader(header);
    }
  } catch (err) {
    console.warn("Statistics source refresh failed for", type, err);
  }
}

/** After a records API write: a statistic recomputes itself; any other type feeds its statistics. */
export async function refreshAfterRecordWrite(typeApiName: string, recordId: string): Promise<void> {
  if (foldRecordTypeApiName(typeApiName) === "statistics") {
    await refreshStatisticFromSource(recordId);
    return;
  }
  await refreshStatisticsFedBy(typeApiName);
}
