/**
 * Locked default fields on every new record type / table (Stephen 2026-09-14).
 * Catalog ERD: docs/coa/RECORD_TYPE_FIELD_INVENTORY.erd.md
 * Additional lookups to existing objects require a follow-up interview.
 */

export type PlatformFieldSeed = {
  api_name: string;
  label: string;
  data_type: "text" | "datetime" | "lookup";
  sort_order: number;
  is_required: boolean;
  lookup_object_api_name: string | null;
};

export const PLATFORM_DEFAULT_FIELDS: readonly PlatformFieldSeed[] = [
  { api_name: "id", label: "ID", data_type: "text", sort_order: 1, is_required: false, lookup_object_api_name: null },
  { api_name: "name", label: "Name", data_type: "text", sort_order: 10, is_required: true, lookup_object_api_name: null },
  { api_name: "external_id", label: "External ID", data_type: "text", sort_order: 8900, is_required: false, lookup_object_api_name: null },
  { api_name: "created_by", label: "Created By", data_type: "lookup", sort_order: 9000, is_required: false, lookup_object_api_name: "user" },
  { api_name: "last_modified_by", label: "Last Modified By", data_type: "lookup", sort_order: 9010, is_required: false, lookup_object_api_name: "user" },
  { api_name: "created_at", label: "Created Date", data_type: "datetime", sort_order: 9020, is_required: false, lookup_object_api_name: null },
  { api_name: "updated_at", label: "Last Modified Date", data_type: "datetime", sort_order: 9030, is_required: false, lookup_object_api_name: null },
] as const;

export const PLATFORM_STAMP_APIS = [
  "id",
  "created_by",
  "last_modified_by",
  "created_at",
  "updated_at",
] as const;

export function isPlatformStampField(apiName: string): boolean {
  return (PLATFORM_STAMP_APIS as readonly string[]).includes(apiName);
}

/** Session-stamped user lookups (subset of platform stamps). */
export const AUDIT_USER_APIS = ["created_by", "last_modified_by"] as const;
