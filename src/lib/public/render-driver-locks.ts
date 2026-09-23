/**
 * Rendering Driver fields that are owned by product code, plus the
 * in-use check for values pairings and Cells depend on.
 *
 * Code-owned keys are never staff-editable. PATCH restores them from the
 * stored record so a crafted request cannot retarget paint.
 */

import {
  pairingFromRecord,
  RENDER_DRIVER_TYPE,
  type ListedRecord,
} from "@/lib/public/driver-pairings";

export { RENDER_DRIVER_TYPE };

/** Header fields whose values are the code catalog, not staff data. */
export const DRIVER_CODE_OWNED_FIELDS = ["code_key", "bind_shape"] as const;

export function isDriverCodeOwnedField(
  objectApiName: string | undefined,
  apiName: string,
): boolean {
  if (objectApiName !== RENDER_DRIVER_TYPE) return false;
  return (DRIVER_CODE_OWNED_FIELDS as readonly string[]).includes(apiName);
}

export function preserveDriverHeaderData(
  current: Record<string, string>,
  incoming: Record<string, string>,
): Record<string, string> {
  const next = { ...incoming };
  for (const key of DRIVER_CODE_OWNED_FIELDS) {
    const stored = current[key];
    if (stored != null && stored !== "") next[key] = stored;
  }
  return next;
}

export function driverBreakNeeded(
  currentStatus: string,
  nextStatus: string,
  currentRecordType: string,
  nextRecordType: string,
): { leavingActive: boolean; recordTypeChanged: boolean } {
  const from = (currentStatus || "active").trim() || "active";
  const to = (nextStatus || "active").trim() || "active";
  return {
    leavingActive: from === "active" && to !== "active",
    recordTypeChanged: currentRecordType.trim() !== nextRecordType.trim(),
  };
}

export function pairingsForDriver(rows: ListedRecord[], driverId: string): ListedRecord[] {
  return rows.filter((row) => pairingFromRecord(row)?.driver_id === driverId);
}

export function driverBreakConfirmBody(args: {
  leavingActive: boolean;
  recordTypeChanged: boolean;
  pairingCount: number;
}): { title: string; description: string } {
  const bits: string[] = [];
  if (args.leavingActive) {
    bits.push("Leaving Active hides this driver from the Canvas type picker and stops visitor paint on bound Cells.");
  }
  if (args.recordTypeChanged) {
    bits.push("Changing Record type does not retarget existing pairings — they keep the previous type.");
  }
  const n = args.pairingCount;
  bits.push(
    n === 1
      ? "1 pairing uses this driver."
      : `${n} pairings use this driver.`,
  );
  return {
    title: "This change affects bound pairings",
    description: bits.join(" "),
  };
}
