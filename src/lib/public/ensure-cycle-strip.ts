import { adapter } from "@/lib/data/adapter";
import { listInstances } from "@/lib/fixtures/record-instances";
import { CYCLE_STRIP_TYPE } from "@/lib/public/cycle-strip";

/** Cycle Strip is branded homepage chrome, not a record type. Drop leftover rows. */
export async function ensureCycleStripRecords(): Promise<void> {
  const existing = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: CYCLE_STRIP_TYPE })
    : listInstances({ type_api_name: CYCLE_STRIP_TYPE });
  for (const row of existing) {
    if (adapter.deleteRecord) await adapter.deleteRecord(row.id);
  }
}
