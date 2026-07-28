"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { theme } from "@/lib/theme";
import { MissionControlScene } from "@/components/r3f/mission-control-scene";
import { EntityListing, type ListingField } from "@/components/listing/entity-listing";
import { SubTabBar } from "@/components/ui/sub-tab-bar";

/**
 * I5.6.10 zone config UI pattern (Stephen):
 * - Nested parents synthesize a Configuration sub-tab first (I5.6.9 / 2026-07-22).
 * - Entity surfaces use presentation "listing": polished table + New/Edit,
 *   collapsible form INLINE on the row (Edit) or under header (New) - not modal.
 * - Nested lists (Policy/Projects/Tasks, Product/Service, Records) use listing; parent Configuration is form.
 * Spec: docs/specs/ZONE_CONFIG_UI_PATTERN_I5.6.md
 *
 * I5.6.34 (2026-07-24): Stable zone chrome — single sticky container for zone header + primary tabs.
 * Sub-tab strip + description live in a stable position outside the card body (no jump on sub-tab change).
 * No repeated faculty heading inside sub-tab panels.
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
  recordTypeApiName?: string;
  parentKind?: string;
  parentApiName?: string;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isDynamic = !!panel.recordTypeApiName;

  useEffect(() => {
    if (!isDynamic) {
      setRows(seedRows);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", panel.recordTypeApiName!);
    params.set("parent_kind", panel.parentKind!);
    params.set("parent", panel.parentApiName!);

    fetch(`/api/records?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch records");
        return r.json();
      })
      .then((json) => {
        const apiRows = (json.data ?? []).map((inst: any) => {
          const cells: Record<string, string> = {
            Name: inst.name,
            Status: inst.status,
            ...inst.data,
          };
          return { id: inst.id, cells };
        });
        setRows(apiRows);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [isDynamic, panel.recordTypeApiName, panel.parentKind, panel.parentApiName, seedRows]);

  const onAdd = async (draft: Record<string, string>) => {
    if (!isDynamic) {
      const id = `${panel.id}-row-${rows.length + 1}`;
      setRows((prev) => [...prev, { id, cells: draft }]);
      return;
    }

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_api_name: panel.recordTypeApiName,
          parent_kind: panel.parentKind,
          parent_api_name: panel.parentApiName,
          name: draft.Name || draft.name || "New Record",
          status: draft.Status || draft.status || "active",
          data: draft,
        }),
      });
      if (!res.ok) throw new Error("Failed to create record");
      const json = await res.json();
      const inst = json.data;
      const cells: Record<string, string> = {
        Name: inst.name,
        Status: inst.status,
        ...inst.data,
      };
      setRows((prev) => [...prev, { id: inst.id, cells }]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onUpdate = async (id: string, draft: Record<string, string>) => {
    if (!isDynamic || id.startsWith(panel.id)) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cells: draft } : r)));
      return;
    }

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.Name || draft.name,
          status: draft.Status || draft.status,
          data: draft,
        }),
      });
      if (!res.ok) throw new Error("Failed to update record");
      const json = await res.json();
      const inst = json.data;
      const cells: Record<string, string> = {
        Name: inst.name,
        Status: inst.status,
        ...inst.data,
      };
      setRows((prev) => prev.map((r) => (r.id === id ? { id: inst.id, cells } : r)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Loading records...
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && (
        <EntityListing
          title={panel.label}
          summary={panel.summary}
          accent={accent}
          fields={fields}
          rows={rows}
          getRowId={(r) => r.id}
          getCell={(r, k) => r.cells[k] ?? ""}
          onAdd={onAdd}
          onUpdate={onUpdate}
          badgeLabel={isDynamic ? "Dynamic Record" : "Listing"}
        />
      )}
    </div>
  );
}


function FormPanel({
  panel,
  accent,
}: {
  panel: ZoneTab;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{panel.summary}</p>
          </div>
          <Badge
            className="shrink-0 border-0 text-white"
            style={{ backgroundColor: accent }}
          >
            Configure
          </Badge>
        </div>
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
      links: [
        ...(tab.links ?? []),
        { href: `/records-editor?parent=${tab.parentKind}:${tab.parentApiName}`, label: "record types" },
      ],
      presentation: undefined,
      listColumns: undefined,
      sampleRows: undefined,
    }),
    [tab]
  );

  const subTabs = useMemo(() => {
    // I5.6.36 #203 — always show subtab bar, even for tabs without children
    if (!tab.children?.length) return [selfPanel];
    return [selfPanel, ...tab.children];
  }, [tab.children, selfPanel]);

  const activeChild = useMemo(() => {
    if (!subTabs?.length) return null;
    return subTabs.find((c) => c.id === childId) ?? subTabs[0];
  }, [subTabs, childId]);

  const panel = activeChild ?? tab;
  const presentation = panel.presentation ?? "form";

  // I5.6.34 — sub-tab strip + description in stable position; body only changes
  return (
    <div className="space-y-3">
      <SubTabBar
        items={subTabs}
        activeId={panel.id}
        accent={accent}
        onSelect={setChildId}
        ariaLabel={`${tab.label} sub-elements`}
      />
      {presentation === "listing" ? (
        <ListingPanel panel={panel} accent={accent} />
      ) : (
        <FormPanel panel={panel} accent={accent} />
      )}
    </div>
  );
}

/** Map 3D hub node id to tab + optional nested child (I5.6.19 / I5.6 board). */
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
  const skipChildResetRef = useRef(false);

  const tab = useMemo(
    () => config.tabs.find((t) => t.id === active) ?? config.tabs[0],
    [active, config.tabs]
  );

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

  const twinAnimSpeed = 0; // I5.6.35 - all zone twins static (Stephen lock)

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
    <div className="space-y-4">
      {/* I5.6.34 — single sticky container: zone header + primary tabs together */}
      <div className="flex flex-col gap-3 bg-background pb-3 pt-1">
        {/* Row 1: zone identity + actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
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

        {/* Row 2: primary element tabs — same sticky container, no independent sticky */}
        <div
          role="tablist"
          aria-label={`${config.title} elements`}
          className="flex flex-wrap gap-1 border-b border-border pb-px"
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
      </div>

      {/* I5.6.31 — twin in collapsible drawer; main column grows when closed */}
      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-300 ease-in-out",
          twinOpen ? "lg:grid-cols-4" : "lg:grid-cols-1"
        )}
      >
        <div
          className={cn(
            "min-w-0 transition-all duration-300",
            twinOpen ? "lg:col-span-2" : "lg:col-span-1"
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
            className="flex min-h-[200px] flex-col lg:col-span-2 lg:min-h-[260px]"
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
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg">
              <MissionControlScene
                showCanvasChrome={false}
                showLegend={false}
                showViewGizmo={false}
                showCameraTelemetry={false}
                showAxes={false}
                ringsMode='50'
                animSpeed={twinAnimSpeed}
                ringGap={1}
                sphereScale={1}
                cameraFitZone={config.id}
                zoneVisible={{
                  organization: config.id === 'organization',
                  collaboration: config.id === 'collaboration',
                  environment: config.id === 'environment',
                }}
                focusedNodeId={focusedNodeId}
                onNodeClick={handleNodeClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
