import { adapter } from "@/lib/data/adapter";
import { listInstances } from "@/lib/fixtures/record-instances";
import { catalogIdFromPair, driverPairKey } from "@/lib/public/render-drivers";
import { RENDER_DRIVER_TYPE, type ListedRecord } from "@/lib/public/driver-pairings";

export async function listDriverRecords(): Promise<ListedRecord[]> {
  return adapter.listRecords
    ? await adapter.listRecords({ type_api_name: RENDER_DRIVER_TYPE })
    : listInstances({ type_api_name: RENDER_DRIVER_TYPE });
}

export function driverIdentityKey(row: ListedRecord): string | null {
  const shape = String(row.data?.bind_shape ?? "").trim();
  const type = String(row.data?.compatible_record_type ?? "").trim();
  if (!shape || !type) return null;
  return driverPairKey(shape, type);
}

export function conflictingDriver(
  rows: ListedRecord[],
  shape: string,
  recordType: string,
  excludeId?: string,
): ListedRecord | undefined {
  const want = driverPairKey(shape, recordType);
  return rows.find((row) => {
    if (row.id === excludeId) return false;
    if ((row.status || "active") === "archived") return false;
    return driverIdentityKey(row) === want;
  });
}

export function catalogAllowsDriverPair(shape: string, recordType: string): boolean {
  return Boolean(catalogIdFromPair(shape, recordType));
}

export function driverConflictMessage(existing: ListedRecord): string {
  return `A Rendering Driver already exists for that Shape and Record type (${existing.name || existing.id}).`;
}
