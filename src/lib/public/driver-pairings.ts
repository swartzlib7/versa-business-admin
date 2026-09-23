/** Unique Driver pairing: (target_record_type, target_record_id, driver_id). */

import {
  defaultOutputId,
  driverEntry,
  foldLegacyDriver,
  outputsForDriver,
  type ElementSelectionMode,
} from "@/lib/public/render-drivers";

export const RENDER_DRIVER_TYPE = "render_driver";
export const DRIVER_PAIRING_TYPE = "driver_pairing";
export const TYPE_LEVEL_TARGET_ID = "*";
export const PAIRING_STAMP_FIELDS = ["target_kind", "record_mode"] as const;

export type PairingRecordMode = "single" | "list" | "rollup";
export type PairingTargetKind = "header" | "lines";

export type DriverPairingFields = {
  driver_id: string;
  target_record_type: string;
  target_record_id: string;
  target_kind: PairingTargetKind;
  selection_mode: ElementSelectionMode;
  input_map_json?: string;
  record_mode?: PairingRecordMode;
  filter_json?: string;
  /** Paint variant chosen on the Element. Options come from the driver's render outputs. */
  render_option?: string;
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
  const rawFilter = typeof data.filter_json === "string" ? data.filter_json : undefined;
  return {
    driver_id,
    target_record_type,
    target_record_id,
    target_kind: kind,
    selection_mode: inferSelectionMode(String(data.selection_mode ?? ""), target_record_id, rawFilter),
    input_map_json: typeof data.input_map_json === "string" ? data.input_map_json : undefined,
    record_mode: mode,
    filter_json: rawFilter,
    render_option: typeof data.render_option === "string" ? data.render_option : undefined,
    page_size: typeof data.page_size === "number" ? data.page_size : undefined,
    page: typeof data.page === "number" ? data.page : undefined,
  };
}

export function inferSelectionMode(
  stored: string,
  targetId: string,
  filterJson?: string,
): ElementSelectionMode {
  if (stored === "one" || stored === "filter" || stored === "all") return stored;
  const filter = (filterJson ?? "").trim();
  if (targetId === TYPE_LEVEL_TARGET_ID) {
    return filter && filter !== "[]" ? "filter" : "all";
  }
  return "one";
}

export function normalizeFilterIdentity(filterJson?: string): string {
  const raw = (filterJson ?? "").trim() || "[]";
  try {
    return JSON.stringify(JSON.parse(raw));
  } catch {
    return raw;
  }
}

export function pairingSelectionKey(
  driverId: string,
  mode: ElementSelectionMode,
  targetId: string,
  filterJson?: string,
): string {
  if (mode === "all") return `${driverId}\0all`;
  if (mode === "filter") return `${driverId}\0filter\0${normalizeFilterIdentity(filterJson)}`;
  return `${driverId}\0one\0${targetId}`;
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
  selectionMode?: ElementSelectionMode,
  filterJson?: string,
): ListedRecord | undefined {
  const mode = selectionMode ?? inferSelectionMode("", targetId, filterJson);
  const want = pairingSelectionKey(driverId, mode, targetId, filterJson);
  return pairings.find((row) => {
    const fields = pairingFromRecord(row);
    if (!fields) return false;
    if (fields.driver_id !== driverId) return false;
    if (fields.target_record_type && targetType && fields.target_record_type !== targetType) {
      return false;
    }
    return pairingSelectionKey(fields.driver_id, fields.selection_mode, fields.target_record_id, fields.filter_json) === want;
  });
}

export function pairingDisplayName(driverLabel: string, recordName: string): string {
  return `${driverLabel} × ${recordName}`.slice(0, 120);
}

export function codeKeyFromDriverRecord(
  row: { data?: Record<string, unknown> } | null | undefined,
): string {
  return String(row?.data?.code_key ?? "").trim();
}

export function isPairingStampField(objectApiName: string | undefined, apiName: string): boolean {
  if (objectApiName !== DRIVER_PAIRING_TYPE) return false;
  return (PAIRING_STAMP_FIELDS as readonly string[]).includes(apiName);
}

/** Target kind + record mode come from the driver Shape, not staff picks. */
export function derivePairingStamps(codeKey: string): {
  target_kind: PairingTargetKind;
  record_mode: PairingRecordMode;
} {
  const entry = driverEntry(codeKey);
  const shape = entry?.bindShape ?? "header";
  if (codeKey === "header-line-stats" || foldLegacyDriver(codeKey).output === "header-line-stats") {
    return { target_kind: "header", record_mode: "rollup" };
  }
  if (shape === "lines_list") return { target_kind: "lines", record_mode: "list" };
  if (shape === "line_single") return { target_kind: "lines", record_mode: "single" };
  if (shape === "lines_only") return { target_kind: "lines", record_mode: "list" };
  return { target_kind: "header", record_mode: "single" };
}

export function pairingTypeAllowed(codeKey: string, targetType: string): boolean {
  const entry = driverEntry(codeKey);
  if (!entry || !targetType) return true;
  if (entry.compatibleTypes.includes("*")) return true;
  return entry.compatibleTypes.includes(targetType);
}

export function pairingAllowsTypeLevel(codeKey: string): boolean {
  const entry = driverEntry(codeKey);
  return Boolean(entry?.elementModes.includes("all") || entry?.compatibleTypes.includes("*"));
}

export function pairingAllowsFilter(codeKey: string): boolean {
  return Boolean(driverEntry(codeKey)?.elementModes.includes("filter"));
}

export function pairingAllowsOne(codeKey: string): boolean {
  const modes = driverEntry(codeKey)?.elementModes;
  return Boolean(!modes?.length || modes.includes("one"));
}

export function stampPairingData(
  incoming: Record<string, string>,
  codeKey: string,
): Record<string, string> {
  const stamps = derivePairingStamps(codeKey);
  const entry = driverEntry(codeKey);
  const next = { ...incoming };
  next.target_kind = stamps.target_kind;
  next.record_mode = stamps.record_mode;
  if (entry?.recordType && entry.recordType !== "*") {
    next.target_record_type = entry.recordType;
  }
  const modes = entry?.elementModes ?? ["one"];
  let mode = inferSelectionMode(String(next.selection_mode ?? ""), String(next.target_record_id ?? ""), next.filter_json);
  if (!modes.includes(mode)) {
    mode = modes.includes("one") ? "one" : modes[0];
  }
  next.selection_mode = mode;
  const outputs = outputsForDriver(codeKey);
  const gridsOnly = outputs.length > 0 && outputs.every((row) => row.id.startsWith("grid-"));
  if (!gridsOnly && outputs.length > 1 && !String(next.render_option ?? "").trim()) {
    next.render_option = defaultOutputId(codeKey);
  }
  if (mode === "all" || mode === "filter") {
    next.target_record_id = TYPE_LEVEL_TARGET_ID;
  }
  if (mode !== "filter") next.filter_json = "[]";
  if (!entry?.supportsFilter && mode !== "filter") next.filter_json = "[]";
  if (!entry?.supportsPagination) {
    next.page_size = "";
    next.page = "";
  }
  return next;
}

export function pairingPayload(args: {
  driverRecordId: string;
  codeKey: string;
  targetType: string;
  targetId: string;
  selectionMode?: ElementSelectionMode;
  inputMap?: Record<string, string>;
  filterJson?: string;
  pageSize?: string;
  page?: string;
}): Record<string, string> {
  return stampPairingData(
    {
      driver_id: args.driverRecordId,
      target_record_type: args.targetType,
      target_record_id: args.targetId,
      selection_mode: args.selectionMode ?? "",
      input_map_json: JSON.stringify(args.inputMap ?? {}),
      filter_json: args.filterJson ?? "[]",
      page_size: args.pageSize ?? "",
      page: args.page ?? "",
    },
    args.codeKey,
  );
}
