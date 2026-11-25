/**
 * Start-up step (1.0.21): every statistic gets its own Time zone. One stored before 1.0.21
 * takes the install zone, which the first 1.0.21 start wrote from the host's zone: the
 * zone its graph lines were stamped in, so no graph moves. Its stamps are recalculated
 * anyway, which changes nothing where the zones agree. Runs once per process; a statistic
 * that has a zone is never touched.
 */
import { isPostgresDataSource } from "@/lib/db/data-source";

export async function fillStatisticTimeZones(): Promise<number> {
  const g = globalThis as Record<string, unknown>;
  if (g.__vbaStatZonesFilled__) return 0;
  g.__vbaStatZonesFilled__ = true;
  if (!isPostgresDataSource()) return 0;
  const { adapter } = await import("@/lib/data/adapter");
  if (!adapter.listRecords) return 0;
  const { installTimeZone } = await import("@/lib/settings/install-time-zone");
  const { touchRecordFieldDb } = await import("@/lib/db/records-store");
  const { restampStatLinesForHeader } = await import("@/lib/db/stat-lines-store");
  const zone = installTimeZone();
  const statistics = await adapter.listRecords({ type_api_name: "statistics" });
  let filled = 0;
  for (const statistic of statistics) {
    if (String(statistic.data?.time_zone ?? "").trim()) continue;
    await touchRecordFieldDb(statistic.id, "time_zone", zone);
    await restampStatLinesForHeader(statistic.id);
    filled += 1;
  }
  if (filled) console.log(`Statistics: ${filled} without a time zone now use the install zone ${zone}.`);
  return filled;
}
