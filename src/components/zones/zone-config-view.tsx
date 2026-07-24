"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { theme } from "@/lib/theme";
import { MissionControlScene } from "@/components/r3f/mission-control-scene";
import { EntityListing, type ListingField } from "@/components/listing/entity-listing";

/**
 * I5.6.10 zone config UI pattern (Stephen):
 * - Nested parents synthesize a Configuration sub-tab first (I5.6.9 / 2026-07-22).
 * - Entity surfaces use presentation "listing": polished table + New/Edit,
 *   collapsible form INLINE on the row (Edit) or under header (New) - not modal.
 * - Nested lists (Policy/Projects/Tasks, Product/Service, Records) use listing; parent Configuration is form.
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

/** I5.6.11 — zone entity tabs use shared EntityListing (parity with Users). */
type ZoneListRow = { id: string; cells: Record<string, string> };

function ListingPanel({
  panel,
  accent,
}: {
  panel: ZoneTab;
  accent: string;
}) {
  const columns = useMemo(() => {
    if (panel.listColumns && panel.listColumns.length > 0) {
      return panel.listColumns;
    }
    return panel.fields.slice(0, 4).map((f) => f.label);
  }, [panel.listColumns, panel.fields]);

  const fields: ListingField[] = useMemo(() => {
    const colSet = new Set(columns);
    const fromFields: ListingField[] = panel.fields.map((f) => ({
      key: f.label,
      label: f.label,
      kind: f.kind ?? "text",
      options: f.options,
      column: colSet.has(f.label),
    }));
    for (const c of columns) {
      if (!fromFields.some((f) => f.key === c)) {
        fromFields.unshift({ key: c, label: c, kind: "text", column: true });
      }
    }
    const ordered: ListingField[] = [];
    for (const c of columns) {
      const f = fromFields.find((x) => x.key === c);
      if (f) ordered.push({ ...f, column: true });
    }
    for (const f of fromFields) {
      if (!columns.includes(f.key)) ordered.push({ ...f, column: false });
    }
    return ordered;
  }, [panel.fields, columns]);

  const seedRows: ZoneListRow[] = useMemo(() => {
    const seed: string[][] =
      panel.sampleRows && panel.sampleRows.length > 0
        ? panel.sampleRows.map((r) => [...r])
        : [
            columns.map((_, i) => (i === 0 ? `Sample ${panel.label} A` : "-")),
            columns.map((_, i) => (i === 0 ? `Sample ${panel.label} B` : "-")),
          ];
    return seed.map((cells, idx) => {
      const rec: Record<string, string> = {};
      columns.forEach((c, i) => {
        rec[c] = cells[i] === "-" ? "" : (cells[i] ?? "");
      });
      return { id: `${panel.id}-row-${idx}`, cells: rec };
    });
  }, [panel.id, panel.sampleRows, panel.label, columns]);

  const [rows, setRows] = useState<ZoneListRow[]>(seedRows);

  useEffect(() => {
    setRows(seedRows);
  }, [seedRows]);

  const getCell = (row: ZoneListRow, key: string) => row.cells[key] ?? "";

  const onAdd = (draft: Record<string, string>) => {
    setRows((prev) => [
      ...prev,
      { id: `${panel.id}-row-${Date.now()}`, cells: { ...draft } },
    ]);
  };

  const onUpdate = (id: string, draft: Record<string, string>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, cells: { ...draft } } : r)),
    );
  };

  return (
    <EntityListing<ZoneListRow>
      title={panel.label}
      summary={panel.summary}
      accent={accent}
      fields={fields}
      rows={rows}
      getRowId={(r) => r.id}
      getCell={getCell}
      onAdd={onAdd}
      onUpdate={onUpdate}
      emptyLabel={`No ${panel.label.toLowerCase()} yet — use New to add the first row.`}
    />
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
    <Card className="overflow-hidden">
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
  childId,
  setChildId,
}: {
  tab: ZoneTab;
  accent: string;
  childId: string;
  setChildId: (id: string) => void;
}) {
  /** I5.6.9 / board 2026-07-22 - parent default sub-tab is Configuration (form), not a parent records list. */
  const selfPanel: ZoneTab = useMemo(
    () => ({
      id: tab.id,
      label: "Configuration",
      summary: tab.summary,
      fields: tab.fields,
      relations: tab.relations,
      links: tab.links,
      // Parent self is always configuration form; listings live on children.
      presentation: undefined,
      listColumns: undefined,
      sampleRows: undefined,
    }),
    [tab]
  );

  const subTabs = useMemo(() => {
    if (!tab.children?.length) return null;
    return [selfPanel, ...tab.children];
  }, [tab.children, selfPanel]);

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

  // I5.6.19 — content only (spatial twin lifted to ZoneConfigView so it does not remount on tab change)
  if (presentation === "listing") {
    return (
      <div className="space-y-3">
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
    );
  }

  return (
    <FormPanel
      panel={panel}
      title={title}
      accent={accent}
      subTabs={subTabs}
      setChildId={setChildId}
      tabLabel={tab.label}
    />
  );
}

/** Map 3D hub node id to tab + optional nested child (I5.6.19 / I5.6 board). Executive=center sphere; no Service/Product hub mapping. */
function resolveNodeToTab(
  nodeId: string,
  config: ZoneConfig
): { tabId: string; childId: string } | null {
  for (const t of config.tabs) {
    if (t.id === nodeId) {
      return { tabId: t.id, childId: t.id };
    }
    if (t.children?.length) {
      for (const c of t.children) {
        if (c.id === nodeId) {
          return { tabId: t.id, childId: c.id };
        }
      }
    }
  }

  return null;
}

export function ZoneConfigView({ config }: { config: ZoneConfig }) {
  const [active, setActive] = useState(config.tabs[0]?.id ?? "");
  const [childId, setChildId] = useState(config.tabs[0]?.id ?? "");
  /** When true, next active change should not reset childId (sphere selected nested). */
  const skipChildResetRef = useRef(false);

  const tab = useMemo(
    () => config.tabs.find((t) => t.id === active) ?? config.tabs[0],
    [active, config.tabs]
  );

  // Reset nested child to parent self-tab when top-level tab changes via tab bar
  useEffect(() => {
    if (skipChildResetRef.current) {
      skipChildResetRef.current = false;
      return;
    }
    setChildId(active);
  }, [active]);

  const focusedNodeId = useMemo(() => {
    if (childId) return childId;
    return active || null;
  }, [active, childId]);

  const selectTab = useCallback((tabId: string) => {
    skipChildResetRef.current = false;
    setActive(tabId);
  }, []);

  const handleNodeClick = useCallback(
    (node: { id: string }) => {
      const resolved = resolveNodeToTab(node.id, config);
      if (!resolved) return;
      skipChildResetRef.current = true;
      setActive(resolved.tabId);
      setChildId(resolved.childId);
    },
    [config]
  );

  // I5.6.19 — static twins on collab/env; org keeps gentle motion
  const twinAnimSpeed =
    config.id === "organization" ? 1 : 0;

  // I5.6.31 — hideable spatial twin drawer; persist per zone; content expands when closed
  const twinStorageKey = `mc.spatialTwinOpen.${config.id}`;
  const [twinOpen, setTwinOpen] = useState(true);
  const [twinHydrated, setTwinHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(twinStorageKey);
      if (raw === "0") setTwinOpen(false);
      else if (raw === "1") setTwinOpen(true);
    } catch {
      /* ignore */
    }
    setTwinHydrated(true);
  }, [twinStorageKey]);

  const setTwinOpenPersist = useCallback(
    (open: boolean) => {
      setTwinOpen(open);
      try {
        localStorage.setItem(twinStorageKey, open ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [twinStorageKey]
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-20 flex flex-col gap-4 bg-background/95 pb-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:flex-row lg:items-end lg:justify-between">
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
            Full 3D hub
          </Link>
          <button
            type="button"
            onClick={() => setTwinOpenPersist(!twinOpen)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-pressed={twinOpen}
            aria-controls={`spatial-twin-drawer-${config.id}`}
            title={twinOpen ? "Hide spatial twin" : "Show spatial twin"}
          >
            {twinOpen ? (
              <PanelRightClose className="h-4 w-4" aria-hidden />
            ) : (
              <PanelRightOpen className="h-4 w-4" aria-hidden />
            )}
            {twinOpen ? "Hide twin" : "Show twin"}
          </button>
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
        className="sticky top-[5.5rem] z-20 flex flex-wrap gap-1 border-b border-border bg-background/95 pb-px backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        {config.tabs.map((t) => {
          const on = t.id === tab?.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => selectTab(t.id)}
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

      {/* I5.6.31 — twin in collapsible drawer; main column grows when closed */}
      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-300 ease-in-out",
          twinOpen ? "lg:grid-cols-5" : "lg:grid-cols-1"
        )}
      >
        <div
          className={cn(
            "min-w-0 transition-all duration-300",
            twinOpen ? "lg:col-span-3" : "lg:col-span-1"
          )}
        >
          {tab && (
            <TabPanel
              tab={tab}
              accent={config.accent}
              childId={childId}
              setChildId={setChildId}
            />
          )}
        </div>

        {twinOpen && (
          <div
            id={`spatial-twin-drawer-${config.id}`}
            className="flex min-h-[630px] flex-col lg:col-span-2"
            data-hydrated={twinHydrated ? "1" : "0"}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Spatial twin · {config.id} only
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {twinAnimSpeed === 0
                    ? "Static · click spheres"
                    : "Live · click spheres"}
                </span>
                <button
                  type="button"
                  onClick={() => setTwinOpenPersist(false)}
                  className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Hide spatial twin drawer"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border">
              <MissionControlScene
                showCanvasChrome={false}
                showLegend={false}
                showViewGizmo={false}
                showCameraTelemetry={false}
                showAxes={false}
                showRings={true}
                animSpeed={twinAnimSpeed}
                ringGap={1}
                sphereScale={1}
                cameraFitZone={config.id}
                focusedNodeId={focusedNodeId}
                onNodeClick={handleNodeClick}
                className="!h-full !min-h-[600px] !rounded-none !border-0"
                zoneVisible={{
                  organization: config.id === "organization",
                  collaboration: config.id === "collaboration",
                  environment: config.id === "environment",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
