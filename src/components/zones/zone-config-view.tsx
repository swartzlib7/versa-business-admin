"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";

/**
 * I5.6.10 zone config UI pattern (Stephen):
 * - Nested parents synthesize a self/default sub-tab first (I5.6.9).
 * - Entity surfaces use presentation "listing": polished table + New/Edit,
 *   collapsible form INLINE on the row (Edit) or under header (New) - not modal.
 * - Executive Policy/Projects/Tasks use listing; Executive self may stay form.
 * Spec: docs/specs/ZONE_CONFIG_UI_PATTERN_I5.6.md
 */

export type ZoneField = {
  label: string;
  placeholder: string;
  kind?: "text" | "textarea" | "select";
  options?: string[];
};

export type ZoneTab = {
  id: string;
  label: string;
  summary: string;
  fields: ZoneField[];
  relations: { zone: string; label: string; hint: string }[];
  links?: { href: string; label: string }[];
  /** Nested UIs under this tab. Parent self-tab is synthesized first in TabPanel (I5.6.9). */
  children?: ZoneTab[];
  /**
   * form = single-record mock (default for Executive tree).
   * listing = multi-row table + collapsible New form (I5.6.10 default for entity tabs).
   */
  presentation?: "form" | "listing";
  /** Column headers for listing tables (defaults derived from fields). */
  listColumns?: string[];
  /** Seed rows for listing mocks. */
  sampleRows?: string[][];
};

export type ZoneConfig = {
  id: "organization" | "collaboration" | "environment";
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  tabs: ZoneTab[];
};

function FieldMock({
  label,
  placeholder,
  kind = "text",
  options,
  value,
  onChange,
}: ZoneField & {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const controlled = value !== undefined;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {kind === "textarea" ? (
        <textarea
          className={cn(base, "min-h-[72px] resize-y")}
          placeholder={placeholder}
          value={controlled ? value : undefined}
          defaultValue={controlled ? undefined : ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
      ) : kind === "select" ? (
        <select
          className={base}
          value={controlled ? value : undefined}
          defaultValue={controlled ? undefined : ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={base}
          placeholder={placeholder}
          value={controlled ? value : undefined}
          defaultValue={controlled ? undefined : ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
      )}
    </label>
  );
}

function RelationsCard({
  relations,
}: {
  relations: ZoneTab["relations"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relationships</CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect this element across zones (keystone ERD pattern).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {relations.map((r) => (
          <div
            key={r.label + r.zone}
            className="rounded-lg border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{r.label}</span>
              <Badge variant="secondary" className="font-normal">
                {r.zone}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.hint}</p>
          </div>
        ))}
        {relations.length === 0 && (
          <p className="text-sm text-muted-foreground">No relations defined yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

/** I5.6.11 - table + New + row-inline collapsible editor (not top-of-page). */
function ListingPanel({
  panel,
  accent,
}: {
  panel: ZoneTab;
  accent: string;
}) {
  const columns =
    panel.listColumns && panel.listColumns.length > 0
      ? panel.listColumns
      : panel.fields.slice(0, 4).map((f) => f.label);

  const seed: string[][] =
    panel.sampleRows && panel.sampleRows.length > 0
      ? panel.sampleRows.map((r) => [...r])
      : [
          columns.map((_, i) => (i === 0 ? `Sample ${panel.label} A` : "-")),
          columns.map((_, i) => (i === 0 ? `Sample ${panel.label} B` : "-")),
        ];

  const [rows, setRows] = useState<string[][]>(seed);
  /** null = closed; "new" = insert form after header; number = edit that row inline */
  const [editor, setEditor] = useState<null | "new" | number>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setRows(seed);
    setEditor(null);
    setDraft({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.id]);

  const fieldForCol = (col: string) =>
    panel.fields.find((f) => f.label === col) ?? {
      label: col,
      placeholder: col,
      kind: "text" as const,
    };

  const blankDraft = () => {
    const d: Record<string, string> = {};
    for (const c of columns) d[c] = "";
    // also include non-column fields for fuller forms
    for (const f of panel.fields) {
      if (!(f.label in d)) d[f.label] = "";
    }
    return d;
  };

  const commitDraft = () => {
    const next = columns.map((c) => draft[c]?.trim() || "-");
    if (typeof editor === "number") {
      setRows((prev) => prev.map((r, i) => (i === editor ? next : r)));
    } else {
      setRows((prev) => [...prev, next]);
    }
    setDraft(blankDraft());
    setEditor(null);
  };

  const startEdit = (idx: number) => {
    if (editor === idx) {
      setEditor(null);
      return;
    }
    const row = rows[idx];
    const d = blankDraft();
    columns.forEach((c, i) => {
      d[c] = row[i] === "-" ? "" : row[i];
    });
    setDraft(d);
    setEditor(idx);
  };

  const startNew = () => {
    if (editor === "new") {
      setEditor(null);
      return;
    }
    setDraft(blankDraft());
    setEditor("new");
  };

  const cancel = () => {
    setEditor(null);
    setDraft(blankDraft());
  };

  const singular = panel.label.endsWith("s")
    ? panel.label.slice(0, -1)
    : panel.label;

  const formFields =
    panel.fields.length > 0
      ? panel.fields
      : columns.map((c) => fieldForCol(c));

  const InlineForm = ({
    heading,
  }: {
    heading: string;
  }) => (
    <div
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{heading}</p>
        <span className="text-xs text-muted-foreground">
          Inline row editor - mock only
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {formFields.map((f) => (
          <div
            key={f.label}
            className={f.kind === "textarea" ? "sm:col-span-2" : undefined}
          >
            <FieldMock
              {...f}
              value={draft[f.label] ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, [f.label]: v }))}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={commitDraft}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          {typeof editor === "number" ? "Update row" : "Add to table"}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{panel.label}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{panel.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="shrink-0 border-0 text-white"
              style={{ backgroundColor: accent }}
            >
              Listing
            </Badge>
            <button
              type="button"
              onClick={startNew}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              {editor === "new" ? "Close" : `New ${singular}`}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {editor === "new" && (
          <InlineForm heading={`New ${singular}`} />
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                {columns.map((c) => (
                  <th key={c} className="px-4 py-2.5 font-medium">
                    {c}
                  </th>
                ))}
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <Fragment key={ri}>
                  <tr
                    className="border-b border-border/70 transition-colors hover:bg-muted/30"
                  >
                    {columns.map((c, ci) => (
                      <td key={c} className="px-4 py-3 align-top text-foreground">
                        <span className="line-clamp-3 whitespace-pre-wrap">
                          {row[ci] ?? "-"}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => startEdit(ri)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                        style={
                          editor === ri
                            ? {
                                borderColor: accent,
                                color: accent,
                              }
                            : undefined
                        }
                      >
                        {editor === ri ? "Close" : "Edit"}
                      </button>
                    </td>
                  </tr>
                  {editor === ri && (
                    <tr key={`edit-${ri}`} className="border-b border-border">
                      <td colSpan={columns.length + 1} className="p-0">
                        <InlineForm heading={`Edit ${singular}`} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No {panel.label.toLowerCase()} yet - use New to add the first row.
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

function FormPanel({
  panel,
  title,
  accent,
  subTabs,
  setChildId,
  tabLabel,
}: {
  panel: ZoneTab;
  title: string;
  accent: string;
  subTabs: ZoneTab[] | null;
  setChildId: (id: string) => void;
  tabLabel: string;
}) {
  return (
    <Card className="lg:col-span-3 overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{panel.summary}</p>
          </div>
          <Badge
            className="shrink-0 border-0 text-white"
            style={{ backgroundColor: accent }}
          >
            Configure
          </Badge>
        </div>
        {subTabs && subTabs.length > 0 && (
          <div
            role="tablist"
            aria-label={`${tabLabel} sub-elements`}
            className="mt-4 flex flex-wrap gap-1"
          >
            {subTabs.map((c) => {
              const on = c.id === panel.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setChildId(c.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  )}
                  style={
                    on ? { boxShadow: `inset 0 -2px 0 ${accent}` } : undefined
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
        {panel.fields.map((f) => (
          <div
            key={f.label}
            className={f.kind === "textarea" ? "sm:col-span-2" : undefined}
          >
            <FieldMock {...f} />
          </div>
        ))}
        {panel.links && panel.links.length > 0 && (
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {panel.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Open {l.label}{' →'}
              </Link>
            ))}
          </div>
        )}
        <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            Save draft
          </button>
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Reset
          </button>
          <span className="self-center text-xs text-muted-foreground">
            Mock only - no persistence yet
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TabPanel({
  tab,
  accent,
}: {
  tab: ZoneTab;
  accent: string;
}) {
  /** I5.6.9 - parent keeps a default/self sub-tab (same label) so nesting does not drop the parent UI. */
  const selfPanel: ZoneTab = useMemo(
    () => ({
      id: tab.id,
      label: tab.label,
      summary: tab.summary,
      fields: tab.fields,
      relations: tab.relations,
      links: tab.links,
      presentation: tab.presentation,
      listColumns: tab.listColumns,
      sampleRows: tab.sampleRows,
    }),
    [tab]
  );

  const subTabs = useMemo(() => {
    if (!tab.children?.length) return null;
    return [selfPanel, ...tab.children];
  }, [tab.children, selfPanel]);

  const [childId, setChildId] = useState(tab.id);
  useEffect(() => {
    setChildId(tab.id);
  }, [tab.id]);

  const activeChild = useMemo(() => {
    if (!subTabs?.length) return null;
    return subTabs.find((c) => c.id === childId) ?? subTabs[0];
  }, [subTabs, childId]);

  const panel = activeChild ?? tab;
  const title =
    subTabs && panel.id !== tab.id
      ? `${tab.label} · ${panel.label}`
      : tab.label;

  const presentation = panel.presentation ?? "form";

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {presentation === "listing" ? (
        <div className="space-y-3 lg:col-span-3">
          {subTabs && subTabs.length > 0 && (
            <div
              role="tablist"
              aria-label={`${tab.label} sub-elements`}
              className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/20 p-1"
            >
              {subTabs.map((c) => {
                const on = c.id === panel.id;
                return (
                  <button
                    key={c.id}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    onClick={() => setChildId(c.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      on
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                    )}
                    style={
                      on ? { boxShadow: `inset 0 -2px 0 ${accent}` } : undefined
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}
          <ListingPanel panel={panel} accent={accent} />
        </div>
      ) : (
        <FormPanel
          panel={panel}
          title={title}
          accent={accent}
          subTabs={subTabs}
          setChildId={setChildId}
          tabLabel={tab.label}
        />
      )}

      <div className="flex flex-col gap-4 lg:col-span-2">
        <RelationsCard relations={panel.relations} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zone map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Spatial twin: Mission Control 3D hub on the dashboard. Operational
              twin: this tabbed surface.
            </p>
            <p className="text-xs">
              Brand: {theme.brand.name}. Pattern:
              docs/specs/ZONE_CONFIG_UI_PATTERN_I5.6.md
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ZoneConfigView({ config }: { config: ZoneConfig }) {
  const [active, setActive] = useState(config.tabs[0]?.id ?? "");
  const tab = useMemo(
    () => config.tabs.find((t) => t.id === active) ?? config.tabs[0],
    [active, config.tabs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: config.accent }}
              aria-hidden
            />
            <Badge variant="outline" className="font-normal">
              Zone config · mock
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
          <p className="max-w-2xl text-muted-foreground">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            3D hub
          </Link>
          <span
            className="rounded-md px-3 py-1.5 font-medium text-white"
            style={{ backgroundColor: config.accent }}
          >
            {config.title}
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={`${config.title} elements`}
        className="flex flex-wrap gap-1 border-b border-border pb-px"
      >
        {config.tabs.map((t) => {
          const on = t.id === tab.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={cn(
                "-mb-px rounded-t-md border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                on
                  ? "border-border border-b-background bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={
                on
                  ? {
                      borderBottomColor: "var(--background)",
                      boxShadow: `inset 0 2px 0 ${config.accent}`,
                    }
                  : undefined
              }
            >
              {t.label}
              {t.children && t.children.length > 0 ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({t.children.length + 1})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab && <TabPanel key={tab.id} tab={tab} accent={config.accent} />}
    </div>
  );
}
