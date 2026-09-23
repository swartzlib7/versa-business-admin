import { adapter } from "@/lib/data/adapter";
import { listInstances } from "@/lib/fixtures/record-instances";
import {
  DRIVER_PAIRING_TYPE,
  findExistingPairing,
  inferSelectionMode,
  pairingFromRecord,
  pairingSelectionKey,
  type ListedRecord,
} from "@/lib/public/driver-pairings";
import type { ElementSelectionMode } from "@/lib/public/render-drivers";

export async function listPairingRecords(): Promise<ListedRecord[]> {
  return adapter.listRecords
    ? await adapter.listRecords({ type_api_name: DRIVER_PAIRING_TYPE })
    : listInstances({ type_api_name: DRIVER_PAIRING_TYPE });
}

export function conflictingPairing(
  rows: ListedRecord[],
  targetType: string,
  targetId: string,
  driverId: string,
  excludeId?: string,
  selectionMode?: ElementSelectionMode,
  filterJson?: string,
): ListedRecord | undefined {
  const hit = findExistingPairing(rows, targetType, targetId, driverId, selectionMode, filterJson);
  if (!hit || hit.id === excludeId) return undefined;
  return hit;
}

export function pairingConflictMessage(existing: ListedRecord): string {
  return `An Element already exists for this driver and record selection (${existing.name || existing.id}). Edit that Element instead.`;
}

export function pairingIdentityKey(
  row: ListedRecord,
  driverCodeKey?: string,
): string | null {
  const fields = pairingFromRecord(row);
  if (!fields) return null;
  const driver = (driverCodeKey || fields.driver_id).trim();
  if (!driver) return null;
  const mode = inferSelectionMode(fields.selection_mode, fields.target_record_id, fields.filter_json);
  return pairingSelectionKey(driver, mode, fields.target_record_id, fields.filter_json);
}
