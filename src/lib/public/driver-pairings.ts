/** Unique Driver pairing: (target_record_type, target_record_id, driver_id). */

export const RENDER_DRIVER_TYPE = "render_driver";
export const DRIVER_PAIRING_TYPE = "driver_pairing";
export const TYPE_LEVEL_TARGET_ID = "*";

export type PairingRecordMode = "single" | "list" | "rollup";
export type PairingTargetKind = "header" | "lines";

export type DriverPairingFields = {
  driver_id: string;
  target_record_type: string;
  target_record_id: string;
  target_kind: PairingTargetKind;
  input_map_json?: string;
  record_mode?: PairingRecordMode;
  filter_json?: string;
  page_size?: number;
  page?: number;
};

export type ListedRecord = {
  id: string;
  name: string;
  status?: string;
  data?: Record<string, unknown>;
};

export function pairingKey(
  targetType: string,
  targetId: string,
  driverId: string,
): string {
  return `${targetType}\0${targetId}\0${driverId}`;
}

export function pairingFromRecord(row: ListedRecord): DriverPairingFields | null {
  const data = row.data ?? {};
  const driver_id = String(data.driver_id ?? "").trim();
  const target_record_type = String(data.target_record_type ?? "").trim();
  const target_record_id = String(data.target_record_id ?? "").trim();
  if (!driver_id || !target_record_type || !target_record_id) return null;
  const kind = data.target_kind === "lines" ? "lines" : "header";
  const mode =
    data.record_mode === "list" || data.record_mode === "rollup" || data.record_mode === "single"
      ? data.record_mode
      : "single";
  return {
    driver_id,
    target_record_type,
    target_record_id,
    target_kind: kind,
    input_map_json: typeof data.input_map_json === "string" ? data.input_map_json : undefined,
    record_mode: mode,
    filter_json: typeof data.filter_json === "string" ? data.filter_json : undefined,
    page_size: typeof data.page_size === "number" ? data.page_size : undefined,
    page: typeof data.page === "number" ? data.page : undefined,
  };
}

export function usedDriverIdsForTarget(
  pairings: ListedRecord[],
  targetType: string,
  targetId: string,
): Set<string> {
  const used = new Set<string>();
  for (const row of pairings) {
    const fields = pairingFromRecord(row);
    if (!fields) continue;
    if (fields.target_record_type === targetType && fields.target_record_id === targetId) {
      used.add(fields.driver_id);
    }
  }
  return used;
}

export function findExistingPairing(
  pairings: ListedRecord[],
  targetType: string,
  targetId: string,
  driverId: string,
): ListedRecord | undefined {
  return pairings.find((row) => {
    const fields = pairingFromRecord(row);
    return (
      fields &&
      fields.target_record_type === targetType &&
      fields.target_record_id === targetId &&
      fields.driver_id === driverId
    );
  });
}

export function pairingDisplayName(driverLabel: string, recordName: string): string {
  return `${driverLabel} × ${recordName}`.slice(0, 120);
}
