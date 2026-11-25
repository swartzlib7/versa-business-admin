/**
 * What travels between two VBA instances (1.0.20, state_integrations.md §3.6, §3.8).
 * Push and pull carry the same items. Every request and answer says `vba_exchange: 1`.
 */
import type { RecordInstance } from "@/lib/fixtures/record-instances";
import type { StatLineRow } from "@/lib/db/stat-lines-store";
import { listFieldDefinitions } from "@/lib/fixtures/catalog";
import { STAT_SOURCE_FIELDS } from "@/lib/integrations/rules";
import { getRecordType } from "@/lib/fixtures/record-types";

export const EXCHANGE_VERSION = 1;

export type RecordItem = {
  table: "record";
  id: string;
  type: string;
  action: "upsert" | "delete";
  name: string;
  status: string;
  data: Record<string, string>;
  lines?: Array<{ line_group?: string; data: Record<string, string> }>;
  updated_at: string;
  /** Fields not carried (lookups, files, secrets), named so nothing disappears silently. */
  left_out?: string[];
  /** Resend all / full re-pull: apply even when this version was applied before (repairs a changed copy). */
  force?: boolean;
};

export type StatLineItem = {
  table: "stat_line";
  id: string;
  header_id: string;
  action: "upsert" | "delete";
  series: number;
  slot: number;
  stamp: string | null;
  value: string;
  updated_at: string;
  force?: boolean;
};

export type ExchangeItem = RecordItem | StatLineItem;

/** The message on a result for an item this side already had (a repeat inside the pull overlap). */
export const ALREADY_HERE = "Already up to date.";

export type ItemResult = {
  table: string;
  id: string;
  /** ok: stored; skipped: outside the receiver's filter; retry: try later; error: a person has to look. */
  status: "ok" | "skipped" | "retry" | "error";
  external_id?: string;
  message?: string;
};

/** Fields that never travel: ids and stamps of this install, integration marks, statistic feeds. */
const NEVER = new Set(["id", "external_id", "source_deleted_at", "created_at", "updated_at", "created_by", "last_modified_by", "name", "status"]);
const NOT_CARRIED_TYPES = new Set(["lookup", "multi_lookup", "file", "image_gallery", "attachments"]);

/** The item for a record: whole record minus what never travels (§3.5, §3.9). */
export function recordItem(record: RecordInstance, action: "upsert" | "delete"): RecordItem {
  const defs = (() => {
    try {
      return listFieldDefinitions(getRecordType(record.type_api_name)?.object_api_name || record.type_api_name);
    } catch {
      return [];
    }
  })();
  const kind = new Map(defs.map((d) => [d.api_name, d]));
  const data: Record<string, string> = {};
  const leftOut: string[] = [];
  for (const [field, value] of Object.entries(record.data ?? {})) {
    if (NEVER.has(field)) continue;
    if (record.type_api_name === "statistics" && (STAT_SOURCE_FIELDS as readonly string[]).includes(field)) continue;
    const def = kind.get(field);
    if (def && (def.is_secret || NOT_CARRIED_TYPES.has(def.data_type))) {
      if (String(value ?? "").trim()) leftOut.push(field);
      continue;
    }
    data[field] = String(value ?? "");
  }
  const item: RecordItem = {
    table: "record",
    id: record.id,
    type: record.type_api_name,
    action,
    name: record.name,
    status: record.status,
    data: action === "delete" ? {} : data,
    // The database change time: also moves on VBA's own knock-on writes (see RecordInstance.updated_at).
    updated_at: String(record.updated_at ?? record.data?.updated_at ?? record.data?.created_at ?? new Date().toISOString()),
  };
  if (action === "upsert" && record.type_api_name !== "statistics" && record.lines?.length) {
    // Line fields that point at other records (e.g. an invoice line's vendor bill), files and secrets
    // stay behind too: their ids mean nothing on the other install.
    item.lines = record.lines.map((line) => {
      const lineData: Record<string, string> = {};
      for (const [field, value] of Object.entries(line.data ?? {})) {
        const def = kind.get(field);
        if (def && (def.is_secret || NOT_CARRIED_TYPES.has(def.data_type))) {
          if (String(value ?? "").trim() && !leftOut.includes(field)) leftOut.push(field);
          continue;
        }
        lineData[field] = String(value ?? "");
      }
      return { line_group: line.line_group, data: lineData };
    });
  }
  if (leftOut.length) item.left_out = leftOut;
  return item;
}

export function statLineItem(headerId: string, line: StatLineRow, action: "upsert" | "delete"): StatLineItem {
  return {
    table: "stat_line",
    id: line.id,
    header_id: headerId,
    action,
    series: line.series,
    slot: line.slot,
    stamp: line.stamp,
    value: line.value,
    updated_at: line.updated_at ?? line.captured_at,
  };
}

export function itemLabel(item: ExchangeItem): string {
  return item.table === "record"
    ? `${item.type} · ${item.name} · ${item.action}`
    : `graph line · series ${item.series} slot ${item.slot} · ${item.action}`;
}

/** Records with an External ID came from somewhere (an integration, the sample or site pack): never sent on. */
export function neverSent(record: Pick<RecordInstance, "type_api_name" | "data">): boolean {
  if (record.type_api_name.startsWith("vendor_")) return true;
  return String(record.data?.external_id ?? "").trim() !== "";
}
