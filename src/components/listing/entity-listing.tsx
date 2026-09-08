"use client";

import { useEffect, useMemo, useState, Fragment, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListingBadge } from "@/components/ui/kind-badge";
import { theme } from "@/lib/theme";
import Link from "next/link";
import { X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { SecretValueField, maskSecretDisplay } from "@/components/ui/secret-value-field";
import {
  ColumnHeaders,
  rowClickIsToggle,
  sortByText,
  toggleSort,
  usePersistedColumnOrder,
  type TableSort,
} from "@/components/settings/records-table";

export type ListingField = {
  key: string;
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "select"
    | "boolean"
    | "number"
    | "date"
    | "datetime"
    | "email"
    | "url"
    | "phone";
  options?: string[];
  /** Display labels (api codes stay as values) */
  optionLabels?: string[];
  /** Show in table columns (default true for first fields) */
  column?: boolean;
  /** Runtime saved-layout preference; defaults to one grid column. */
  span?: 1 | 2;
  /** Mask on screen (Show / Hide). */
  secret?: boolean;
};

export type EntityListingProps<T extends Record<string, unknown>> = {
  title?: string;
  summary: string;
  accent?: string;
  fields: ListingField[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Map row -> raw field values (used for edit draft) */
  getCell: (row: T, key: string) => string;
  /** Optional display formatter (defaults to getCell) */
  formatCell?: (row: T, key: string, raw: string) => string;
  /** Optional rich cell renderer (wins over formatCell when provided) */
  renderCell?: (row: T, key: string, raw: string) => ReactNode;
  /** Called when user adds a mock/local row (optional persistence later) */
  onAdd?: (draft: Record<string, string>) => Promise<boolean | void> | boolean | void;
  onUpdate?: (id: string, draft: Record<string, string>) => Promise<boolean | void> | boolean | void;
  /** Optional delete handler (dynamic records). Shows a Delete control per row. */
  onDelete?: (id: string) => void;
  emptyLabel?: string;
  headerExtra?: ReactNode;
  /** Filters / extra controls in the New Record row (Records Editor Field pattern). */
  headerFilters?: ReactNode;
  /** Optional href for a "View" button on each row */
  viewHref?: (row: T) => string;
  /** #185 Slice A (rev E section 7.3): row-click detail navigation. When set,
   *  clicking a row (outside its action controls) opens the record detail. */
  onRowOpen?: (row: T) => void;
  /** Optional badge text (default Listing) */
  badgeLabel?: string;
  deleteTitle?: string;
  deleteDescription?: string;
  /** Persist column order under this key. Defaults to title + field keys. */
  columnStorageKey?: string;
  /** Preferred visible column order (unknown keys ignored; remaining fields append). */
  columnOrder?: string[];
  /** Drag headers to reorder. Default true. */
  reorderable?: boolean;
};

type ListingCriterion = { key: string; value: string };

/**
 * Shared listing toolbar (state_listing_toolbar.md WU-01/WU-02): criteria
 * chips for any rendered, non-secret column — picklist for select / boolean,
 * typed value otherwise. Column picker arrives with WU-03.
 */
function ListingToolbar({
  fields,
  criteria,
  onAdd,
  onRemove,
  onClear,
}: {
  fields: ListingField[];
  criteria: ListingCriterion[];
  onAdd: (criterion: ListingCriterion) => void;
  onRemove: (key: string, value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [columnKey, setColumnKey] = useState("");
  const [value, setValue] = useState("");
  const filterable = useMemo(
    () => fields.filter((f) => f.column !== false && !f.secret),
    [fields],
  );
  const activeField = filterable.find((f) => f.key === columnKey);
  const valueOptions = useMemo(() => {
    if (!activeField) return [];
    if (activeField.kind === "boolean") return ["true", "false"];
    return activeField.options ?? [];
  }, [activeField]);
  const usePicklist = useMemo(() => {
    if (!activeField) return false;
    return (
      activeField.kind === "boolean" ||
      (activeField.kind === "select" && (activeField.options?.length ?? 0) > 0)
    );
  }, [activeField]);
  const commit = () => {
    if (!activeField || !value.trim()) return;
    onAdd({ key: activeField.key, value: value.trim() });
    setValue("");
    setOpen(false);
  };
  const chipLabel = (c: ListingCriterion) => {
    const field = fields.find((f) => f.key === c.key);
    const idx = field?.options?.indexOf(c.value) ?? -1;
    const shown =
      field?.optionLabels && idx >= 0
        ? field.optionLabels[idx]
        : field?.kind === "boolean"
          ? c.value === "true"
            ? "Yes"
            : "No"
          : c.value;
    return (field?.label ?? c.key) + ": " + shown;
  };
  if (filterable.length === 0 && criteria.length === 0) return null;
  return (
    <div className="border-b border-border bg-muted/20 px-4 py-2.5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setColumnKey("");
            setValue("");
          }}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          Filter
        </button>
        {criteria.map((c) => (
          <span
            key={c.key + ":" + c.value}
            className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs"
          >
            {chipLabel(c)}
            <button
              type="button"
              aria-label={"Remove filter " + chipLabel(c)}
              onClick={() => onRemove(c.key, c.value)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {criteria.length > 1 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={columnKey}
            onChange={(e) => {
              setColumnKey(e.target.value);
              setValue("");
            }}
          >
            <option value="">Column…</option>
            {filterable.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          {activeField &&
            (usePicklist ? (
              <select
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Value…</option>
                {valueOptions.map((v) => {
                  const idx = activeField.options?.indexOf(v) ?? -1;
                  const shown =
                    activeField.optionLabels && idx >= 0
                      ? activeField.optionLabels[idx]
                      : activeField.kind === "boolean"
                        ? v === "true"
                          ? "Yes"
                          : "No"
                        : v;
                  return (
                    <option key={v} value={v}>
                      {shown}
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                type="text"
                placeholder="Value…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                }}
              />
            ))}
          <button
            type="button"
            onClick={commit}
            disabled={!activeField || !value.trim()}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            style={
              activeField && value
                ? { borderColor: theme.colors.brand, color: theme.colors.brand }
                : undefined
            }
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ListingField;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const kind = field.kind ?? "text";
  const isChecked = value === "true" || value === "1";
  if (field.secret) {
    return (
      <SecretValueField
        label={field.label}
        value={value}
        onChange={onChange}
      />
    );
  }
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
      {kind === "textarea" ? (
        <textarea
          className={cn(base, "min-h-[72px] resize-y")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : kind === "select" ? (
        <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {(field.options ?? []).map((o, i) => (
            <option key={o} value={o}>
              {field.optionLabels?.[i] ?? o}
            </option>
          ))}
        </select>
      ) : kind === "boolean" ? (
        <BooleanSwitch
          checked={isChecked}
          onChange={(next) => onChange(next ? "true" : "false")}
        />
      ) : (
        <input
          className={base}
          type={
            kind === "number"
              ? "number"
              : kind === "date"
                ? "date"
                : kind === "datetime"
                  ? "datetime-local"
                  : kind === "email"
                    ? "email"
                    : kind === "url"
                      ? "url"
                      : kind === "phone"
                        ? "tel"
                        : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function InlineForm({
  heading,
  fields,
  draft,
  setDraft,
  accent,
  onCommit,
  onCancel,
  commitLabel,
}: {
  heading: string;
  fields: ListingField[];
  draft: Record<string, string>;
  setDraft: Dispatch<SetStateAction<Record<string, string>>>;
  accent: string;
  onCommit: () => void;
  onCancel: () => void;
  commitLabel: string;
}) {
  return (
    <div
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <span className="text-xs text-muted-foreground">Inline row editor</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={(f.span === 2 || f.kind === "textarea") ? "sm:col-span-2" : undefined}>
            <FieldInput
              field={f}
              value={draft[f.key] ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCommit}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {commitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * I5.6.10/11 listing pattern: table + New under header + Edit expands INLINE on row.
 * Shared by Users pilot and zone config entity tabs.
 */
export function EntityListing<T extends Record<string, unknown>>({
  title = "",
  summary,
  accent = theme.colors.brand,
  fields,
  rows,
  getRowId,
  getCell,
  formatCell,
  renderCell,
  onAdd,
  onUpdate,
  onDelete,
  emptyLabel,
  headerExtra,
  headerFilters,
  viewHref,
  onRowOpen,
  badgeLabel = "Listing",
  deleteTitle = "Delete this record?",
  deleteDescription = "This permanently removes the record. This cannot be undone.",
  columnStorageKey,
  columnOrder,
  reorderable = true,
}: EntityListingProps<T>) {
  const displayCell = (row: T, key: string): ReactNode => {
    const raw = getCell(row, key);
    if (renderCell) return renderCell(row, key, raw);
    const field = fields.find((f) => f.key === key);
    if (field?.secret) return maskSecretDisplay(raw);
    return formatCell ? formatCell(row, key, raw) : raw;
  };
  const columns = useMemo(
    () => fields.filter((f) => f.column !== false),
    [fields],
  );
  const defaultColKeys = useMemo(() => {
    const keys = columns.map((c) => c.key);
    if (!columnOrder?.length) return keys;
    const known = new Set(keys);
    const next = columnOrder.filter((k) => known.has(k));
    for (const k of keys) if (!next.includes(k)) next.push(k);
    return next;
  }, [columns, columnOrder]);
  const persistKey = columnStorageKey ?? `mc.listing.${title || "table"}.${defaultColKeys.join(".")}`;
  const [colKeys, reorderCols] = usePersistedColumnOrder(persistKey, defaultColKeys);
  const [sort, setSort] = useState<TableSort>({ key: defaultColKeys[0] ?? "", dir: "asc" });
  const [dragOver, setDragOver] = useState<string | null>(null);
  const orderedColumns = useMemo(
    () => colKeys.map((k) => columns.find((c) => c.key === k)).filter((c): c is ListingField => Boolean(c)),
    [colKeys, columns],
  );
  const headerCols = useMemo(
    () => (onAdd || onUpdate || onDelete || viewHref ? [...colKeys, "actions"] : colKeys),
    [colKeys, onAdd, onUpdate, onDelete, viewHref],
  );
  const headerMeta = useMemo(() => {
    const meta: Record<string, { label: string; sortKey?: string }> = {
      actions: { label: "Actions" },
    };
    for (const c of columns) meta[c.key] = { label: c.label, sortKey: c.key };
    return meta;
  }, [columns]);
  const activeSort = useMemo<TableSort>(
    () =>
      colKeys.includes(sort.key)
        ? sort
        : { key: colKeys[0] ?? "", dir: "asc" },
    [colKeys, sort],
  );
  const [criteria, setCriteria] = useState<ListingCriterion[]>([]);
  const addCriterion = (criterion: ListingCriterion) =>
    setCriteria((cs) =>
      cs.some((c) => c.key === criterion.key && c.value === criterion.value) ? cs : [...cs, criterion],
    );
  const removeCriterion = (key: string, value: string) =>
    setCriteria((cs) => cs.filter((c) => !(c.key === key && c.value === value)));
  const clearCriteria = () => setCriteria([]);
  const filteredRows = useMemo(
    () =>
      criteria.length === 0
        ? rows
        : rows.filter((row) =>
            criteria.every((c) => {
              // WU-02: match the raw api value OR the displayed text
              // (picklists commit raw values; cells may render labels).
              const raw = getCell(row, c.key);
              const shown = formatCell ? formatCell(row, c.key, raw) : raw;
              const needle = c.value.trim().toLowerCase();
              return (
                raw.trim().toLowerCase() === needle ||
                shown.trim().toLowerCase() === needle
              );
            }),
          ),
    [rows, criteria, getCell, formatCell],
  );
  const sortedRows = useMemo(
    () =>
      !activeSort.key
        ? filteredRows
        : sortByText(filteredRows, activeSort.dir, (row) => {
            const raw = getCell(row, activeSort.key);
            return formatCell ? formatCell(row, activeSort.key, raw) : raw;
          }),
    [filteredRows, activeSort, getCell, formatCell],
  );

  const [editor, setEditor] = useState<null | "new" | string>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEditor(null);
    setDraft({});
  }, [title]);

  const blank = () => {
    const d: Record<string, string> = {};
    for (const f of fields) d[f.key] = "";
    return d;
  };

  const startNew = () => {
    if (editor === "new") {
      setEditor(null);
      return;
    }
    setDraft(blank());
    setEditor("new");
  };

  const startEdit = (row: T) => {
    const id = getRowId(row);
    if (editor === id) {
      setEditor(null);
      return;
    }
    const d = blank();
    for (const f of fields) d[f.key] = getCell(row, f.key);
    setDraft(d);
    setEditor(id);
  };

  const cancel = () => {
    setEditor(null);
    setDraft(blank());
  };

  const commit = async () => {
    let ok = true;
    if (editor === "new") {
      ok = (await onAdd?.(draft)) !== false;
    } else if (typeof editor === "string") {
      ok = (await onUpdate?.(editor, draft)) !== false;
    }
    // L3: keep the draft + editor open when validation failed (handler returned false).
    if (ok) {
      setEditor(null);
      setDraft(blank());
    }
  };

  return (
    <>
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <CardTitle className="text-lg">{title}</CardTitle> : null}
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 whitespace-nowrap">
            <div className="flex flex-nowrap items-center justify-end gap-2">
              {headerFilters}
              {(onAdd || onUpdate || viewHref) && (
                <button
                  type="button"
                  onClick={startNew}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  {editor === "new" ? "Close" : "New Record"}
                </button>
              )}
            </div>
            <ListingBadge label={badgeLabel} accent={accent} />
            {headerExtra}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <ListingToolbar
          fields={fields}
          criteria={criteria}
          onAdd={addCriterion}
          onRemove={removeCriterion}
          onClear={clearCriteria}
        />
        {editor === "new" && (
          <InlineForm
            heading="New Record"
            fields={fields}
            draft={draft}
            setDraft={setDraft}
            accent={accent}
            onCommit={commit}
            onCancel={cancel}
            commitLabel="Add to table"
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <ColumnHeaders
                cols={headerCols}
                meta={headerMeta}
                sort={activeSort}
                onSort={(k) => setSort((s) => toggleSort(s, k))}
                onReorder={reorderCols}
                dragOver={dragOver}
                onDragOverKey={setDragOver}
                reorderable={reorderable}
              />
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                const id = getRowId(row);
                return (
                  <Fragment key={id}>
                    <tr
                      className={cn(
                        "border-b border-border/70 transition-colors hover:bg-muted/30",
                        (onRowOpen || onAdd || onUpdate) && "cursor-pointer",
                        editor === id && "bg-muted/40",
                      )}
                      onClick={(e) => {
                        if (!rowClickIsToggle(e.target)) return;
                        if (onRowOpen) onRowOpen(row);
                        else if (onAdd || onUpdate) startEdit(row);
                      }}
                    >
                      {orderedColumns.map((c) => (
                        <td key={c.key} className="px-4 py-3 align-top text-foreground">
                          <span className="line-clamp-3 whitespace-pre-wrap">
                            {displayCell(row, c.key) || "—"}
                          </span>
                        </td>
                      ))}
                      {(onAdd || onUpdate || onDelete || viewHref) && (
                        <td className="px-4 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {viewHref && (
                              <Link
                                href={viewHref(row)}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                              >
                                View
                              </Link>
                            )}
                            {(onAdd || onUpdate) && (
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                style={
                                  editor === id
                                    ? { borderColor: accent, color: accent }
                                    : undefined
                                }
                              >
                                {editor === id ? "Close" : "Edit"}
                              </button>
                            )}
                            {onDelete && (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(id)}
                                className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {editor === id && (
                      <tr className="border-b border-border">
                        <td
                          colSpan={orderedColumns.length + (onAdd || onUpdate || onDelete || viewHref ? 1 : 0)}
                          className="p-0"
                        >
                          <InlineForm
                            heading="Edit Record"
                            fields={fields}
                            draft={draft}
                            setDraft={setDraft}
                            accent={accent}
                            onCommit={commit}
                            onCancel={cancel}
                            commitLabel="Update row"
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={orderedColumns.length + (onAdd || onUpdate || onDelete || viewHref ? 1 : 0)}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyLabel ??
                      `No ${title.toLowerCase()} yet — use New to add the first row.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
    <ConfirmDialog
      open={pendingDeleteId !== null}
      title={deleteTitle}
      description={deleteDescription}
      confirmLabel="Delete"
      tone="danger"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={() => {
        if (pendingDeleteId && onDelete) onDelete(pendingDeleteId);
        setPendingDeleteId(null);
      }}
    />
    </>
  );
}
