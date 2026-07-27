"use client";

import { useEffect, useMemo, useState, Fragment, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";
import Link from "next/link";

export type ListingField = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "select";
  options?: string[];
  /** Display labels parallel to options (api codes stay as values) */
  optionLabels?: string[];
  /** Show in table columns (default true for first fields) */
  column?: boolean;
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
  onAdd?: (draft: Record<string, string>) => void;
  onUpdate?: (id: string, draft: Record<string, string>) => void;
  emptyLabel?: string;
  headerExtra?: ReactNode;
  /** Optional href for a "View" button on each row */
  viewHref?: (row: T) => string;
  /** Optional badge text (default Listing) */
  badgeLabel?: string;
};

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
      ) : (
        <input className={base} value={value} onChange={(e) => onChange(e.target.value)} />
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
          <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : undefined}>
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
  emptyLabel,
  headerExtra,
  viewHref,
  badgeLabel = "Listing",
}: EntityListingProps<T>) {
  const displayCell = (row: T, key: string): ReactNode => {
    const raw = getCell(row, key);
    if (renderCell) return renderCell(row, key, raw);
    return formatCell ? formatCell(row, key, raw) : raw;
  };
  const columns = useMemo(
    () => fields.filter((f) => f.column !== false),
    [fields],
  );

  const [editor, setEditor] = useState<null | "new" | string>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

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

  const commit = () => {
    if (editor === "new") {
      onAdd?.(draft);
    } else if (typeof editor === "string") {
      onUpdate?.(editor, draft);
    }
    setEditor(null);
    setDraft(blank());
  };

  const singular = title ? (title.endsWith("s") ? title.slice(0, -1) : title) : "item";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <CardTitle className="text-lg">{title}</CardTitle> : null}
            <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: accent }}
            >
              {badgeLabel}
            </Badge>
            {headerExtra}
            {(onAdd || onUpdate || viewHref) && (
              <button
                type="button"
                onClick={startNew}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: accent }}
              >
                {editor === "new" ? "Close" : `New ${singular}`}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {editor === "new" && (
          <InlineForm
            heading={`New ${singular}`}
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
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium">
                    {c.label}
                  </th>
                ))}
                {(onAdd || onUpdate || viewHref) && (
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = getRowId(row);
                return (
                  <Fragment key={id}>
                    <tr className="border-b border-border/70 transition-colors hover:bg-muted/30">
                      {columns.map((c) => (
                        <td key={c.key} className="px-4 py-3 align-top text-foreground">
                          <span className="line-clamp-3 whitespace-pre-wrap">
                            {displayCell(row, c.key) || "—"}
                          </span>
                        </td>
                      ))}
                      {(onAdd || onUpdate || viewHref) && (
                        <td className="px-4 py-3 text-right align-top">
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
                          </div>
                        </td>
                      )}
                    </tr>
                    {editor === id && (
                      <tr className="border-b border-border">
                        <td
                          colSpan={columns.length + (onAdd || onUpdate ? 1 : 0)}
                          className="p-0"
                        >
                          <InlineForm
                            heading={`Edit ${singular}`}
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
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (onAdd || onUpdate ? 1 : 0)}
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
  );
}
