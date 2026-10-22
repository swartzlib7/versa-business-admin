"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { parseIdList, serializeIdList } from "@/lib/records/list-values";

export type RecordOption = { id: string; name: string };

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; rows: Promise<RecordOption[]> }>();

/** Active records of one type as `{ id, name }`, shared across fields for a minute. */
export function loadRecordOptions(recordType: string): Promise<RecordOption[]> {
  const hit = cache.get(recordType);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;
  const rows = fetch(`/api/records?type=${encodeURIComponent(recordType)}`, { credentials: "include" })
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((json: { data?: Array<{ id: string; name?: string; status?: string }> }) =>
      (json.data ?? [])
        .filter((row) => row.id && row.status !== "archived")
        .map((row) => ({ id: row.id, name: row.name || row.id })),
    )
    .catch(() => {
      cache.delete(recordType);
      return [] as RecordOption[];
    });
  cache.set(recordType, { at: Date.now(), rows });
  return rows;
}

function useRecordOptions(recordType: string | null | undefined): RecordOption[] {
  const [loaded, setLoaded] = useState<{ type: string; rows: RecordOption[] } | null>(null);
  useEffect(() => {
    if (!recordType) return;
    let live = true;
    void loadRecordOptions(recordType).then((rows) => {
      if (live) setLoaded({ type: recordType, rows });
    });
    return () => {
      live = false;
    };
  }, [recordType]);
  return loaded && loaded.type === recordType ? loaded.rows : [];
}

/** Names for a stored multi-lookup value (list cells). */
export function RecordNames({ value, recordType }: { value: string; recordType?: string | null }) {
  const options = useRecordOptions(recordType);
  const ids = parseIdList(value);
  if (!ids.length) return null;
  const byId = new Map(options.map((row) => [row.id, row.name]));
  return <>{ids.map((id) => byId.get(id) ?? "…").join(", ")}</>;
}

/** Several linked records of one type, shown as chips. Contract: state_hats.md § 1.4. */
export function RecordMultiLookupField({
  label,
  value,
  onChange,
  readOnly,
  required,
  recordType,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  required?: boolean;
  recordType?: string | null;
}) {
  const options = useRecordOptions(recordType);
  const ids = parseIdList(value);
  const byId = new Map(options.map((row) => [row.id, row.name]));
  const remaining = options.filter((row) => !ids.includes(row.id));
  const editable = !readOnly && !!onChange;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {ids.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 py-0.5 pl-2.5 pr-1 text-sm"
            >
              <span>{byId.get(id) ?? (options.length ? "Removed record" : "…")}</span>
              {editable ? (
                <button
                  type="button"
                  aria-label={`Remove ${byId.get(id) ?? "record"}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onChange(serializeIdList(ids.filter((x) => x !== id)))}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{editable ? "None chosen" : "—"}</p>
      )}
      {editable ? (
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value=""
          aria-label={`Add to ${label}`}
          disabled={!remaining.length}
          onChange={(event) => {
            const id = event.target.value;
            if (id) onChange(serializeIdList([...ids, id]));
          }}
        >
          <option value="">{remaining.length ? "Add…" : options.length ? "All added" : "No records yet"}</option>
          {remaining.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
