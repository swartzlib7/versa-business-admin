"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListingBadge } from "@/components/ui/kind-badge";

import { theme } from "@/lib/theme";
import { MissionControlScene } from "@/components/r3f/mission-control-scene";
import { EntityListing, type ListingField } from "@/components/listing/entity-listing";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { OrganizationsPanel, OrgTypeListingPanel, PrimaryOrgPanel } from "@/components/organizations/organizations-panel";
import { DivisionConfigPanel, RecordRelationsPanel } from "@/components/zones/element-config-panel";
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import { useSavedRuntimeLayouts } from "@/lib/catalog/use-saved-runtime-layouts";
import { dataTypeToUiKind, optionsForField } from "@/lib/catalog/layout-to-fields";
import type { CatalogDataType } from "@/lib/fixtures/catalog";

// #249 Slice E2 (rev E section 2.6): the 7 organization-zone elements are
// divisions; element_config keys on the tab id (element_api_name).
/** Gate 3: these divisions keep named children (Contacts, Messages, …) and do not host a generic Records self-tab. */
const NO_RECORDS_SELF_TAB = new Set([
  "public",
  "communications",
  "dissemination",
  "treasury",
  "production",
  "qualification",
]);

function defaultChildIdForTab(tab: ZoneTab): string {
  if (tab.id === "org-configuration") return tab.id;
  if (NO_RECORDS_SELF_TAB.has(tab.id) && tab.children?.[0]) return tab.children[0].id;
  return tab.id;
}

function selfTabLabel(tab: ZoneTab): string {
  if (tab.id === "executive") return "Organizations";
  if (tab.id === "org-configuration") return "Configuration";
  const labels: Record<string, string> = {
    vendor: "Vendors",
    customer: "Customers",
    partner: "Partners",
    branch: "Branches",
    locations: "Locations",
    events: "Events",
    knowledge: "Knowledge",
    schedules: "Schedules",
  };
  return labels[tab.id] ?? "Records";
}

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
  /** Runtime structure mode for dynamic record types (I2). */
  structure?: "list" | "header" | "header_lines";
  /** Column headers for listing tables (defaults derived from fields). */
  listColumns?: string[];
  /** Seed rows for listing mocks. */
  sampleRows?: string[][];
  recordTypeApiName?: string;
  objectApiName?: string;
  parentKind?: string;
  parentApiName?: string;
  /** #248 Slice D (C6): collaboration tabs render organizations of this type. */
  orgTypePanel?: "vendor" | "customer" | "partner" | "branch";
  /** Slice F (D1 cutover): child renders org-attached record_line rows for
   * the parent org (line_group = orgLinesGroup). */
  orgLinesGroup?: string;
};

export type ZoneId = "organization" | "collaboration" | "environment";

export type ZoneConfig = {
  id: ZoneId | "stats";
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  tabs: ZoneTab[];
};

function isHubZone(id: ZoneConfig["id"]): id is ZoneId {
  return id === "organization" || id === "collaboration" || id === "environment";
}

const ORG_CONFIGURATION_TAB: ZoneTab = {
  id: "org-configuration",
  label: "Configuration",
  summary: "Primary Org and appointed staff for this Mission Control.",
  fields: [],
  relations: [],
};

function makeSelfPanel(tab: ZoneTab): ZoneTab {
  return {
    id: tab.id,
    label: selfTabLabel(tab),
    summary: tab.summary,
    fields: tab.fields,
    relations: tab.relations,
    orgTypePanel: tab.orgTypePanel,
    orgLinesGroup: tab.orgLinesGroup,
    links: [
      ...(tab.links ?? []),
      { href: `/records-editor?parent=${tab.parentKind}:${tab.parentApiName}`, label: "record types" },
    ],
    ...(tab.recordTypeApiName
      ? {
          structure: tab.structure,
          presentation: tab.presentation,
          listColumns: tab.listColumns,
          recordTypeApiName: tab.recordTypeApiName,
          objectApiName: tab.objectApiName,
          parentKind: tab.parentKind,
          parentApiName: tab.parentApiName,
        }
      : {
          presentation: undefined,
          listColumns: undefined,
        }),
    sampleRows: undefined,
  };
}

function zoneSubTabs(tab: ZoneTab): ZoneTab[] {
  if (tab.id === "org-configuration") {
    return [{ ...tab, label: "Configuration", sampleRows: undefined }];
  }
  const hideRecordsSelf = NO_RECORDS_SELF_TAB.has(tab.id);
  const selfPanel = makeSelfPanel(tab);
  if (hideRecordsSelf) return tab.children?.length ? tab.children : [];
  if (!tab.children?.length) return [selfPanel];
  return [selfPanel, ...tab.children];
}

function organizationTabs(config: ZoneConfig): ZoneTab[] {
  if (config.id !== "organization") return config.tabs;
  const base = config.tabs.filter((t) => t.id !== "org-configuration");
  return [...base, ORG_CONFIGURATION_TAB];
}

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

/** J4: filter a field list by header_lines placement. role "header" keeps
 *  header-placed + unassigned (default) fields; "list" keeps list-placed +
 *  unassigned. Explicit opposite placement is excluded. */
function filterByZoneRole<T extends { zoneRole?: "header" | "list" | null }>(
  fields: T[],
  role: "header" | "list",
): T[] {
  // L2: on header_lines, migration guarantees every field is exactly header or
  // list (never null), so this enforces strict separation. Pure Header/List
  // types keep null zoneRole, so they must be included (all fields belong to
  // that single mode).
  return fields.filter((f) => f.zoneRole == null || f.zoneRole === role);
}

/**
 * #244 Slice F (D1 cutover): org-attached lines panel (C3 design note).
 * Renders record_line rows attached to organizations of the parent tab's type
 * (vendor integrations: line_group='integrations'); the vendor_integration
 * record type is retired. Rows aggregate across all orgs of the type; the
 * Vendor select in the add form chooses the owning organization.
 */
function OrgLinesPanel({
  orgType,
  lineGroup,
  fields,
  listColumns,
  accent,
  summary,
}: {
  orgType: string;
  lineGroup: string;
  fields: ZoneField[];
  listColumns?: string[];
  accent?: string;
  summary?: string;
}) {
  type OrgLine = {
    id: string;
    organization_id: string;
    line_group: string;
    data: Record<string, string>;
    sort_order: number;
  };
  // Retired vendor_integration field api_names (catalog.ts pre-cutover) so
  // migration-0004 rows keep rendering: name/kind/status/notes.
  const dataKeyByLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of fields) {
      const label = f.label.toLowerCase();
      if (label.includes('name')) map.set(f.label, 'name');
      else if (label.includes('kind')) map.set(f.label, 'kind');
      else if (label.includes('status')) map.set(f.label, 'status');
      else if (label.includes('note')) map.set(f.label, 'notes');
      else map.set(f.label, f.label.toLowerCase().replace(/\s+/g, '_'));
    }
    return map;
  }, [fields]);

  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [lines, setLines] = useState<OrgLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  // Slice F lint: no synchronous setState before the first await (the initial
  // loading state is true from useState; refreshes keep the list visible).
  const load = useCallback(async () => {
    try {
      const orgRes = await fetch('/api/organizations?org_type=' + encodeURIComponent(orgType), {
        credentials: 'include',
      });
      if (!orgRes.ok) throw new Error('Failed to load organizations');
      const orgJson = await orgRes.json();
      const orgList = (orgJson.data ?? []) as { id: string; name: string }[];
      setOrgs(orgList);
      const lineLists = await Promise.all(
        orgList.map((o) =>
          fetch(
            '/api/organizations/' + o.id + '/lines?line_group=' + encodeURIComponent(lineGroup),
            { credentials: 'include' },
          )
            .then((r) => (r.ok ? r.json() : { data: [] }))
            .then((j) => (j.data ?? []) as OrgLine[])
            .catch(() => [] as OrgLine[]),
        ),
      );
      setLines(lineLists.flat());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lines');
    } finally {
      setLoading(false);
    }
  }, [orgType, lineGroup]);

  // Slice F lint: load starts on a microtask (not synchronously in the effect)
  // per react-hooks/set-state-in-effect; cancelled guard prevents late setState.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) return load();
      return undefined;
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const orgNameById = useMemo(() => new Map(orgs.map((o) => [o.id, o.name])), [orgs]);
  const orgIdByName = useMemo(() => new Map(orgs.map((o) => [o.name, o.id])), [orgs]);

  const listingFields: ListingField[] = useMemo(() => {
    const cols = new Set(listColumns ?? []);
    const out: ListingField[] = [
      {
        key: 'Vendor',
        label: 'Vendor',
        kind: 'select',
        options: orgs.map((o) => o.name),
        column: true,
      },
    ];
    for (const f of fields) {
      out.push({
        key: f.label,
        label: f.label,
        kind: f.kind ?? 'text',
        options: f.options,
        column: cols.size === 0 || cols.has(f.label),
      });
    }
    return out;
  }, [fields, listColumns, orgs]);

  const rows = useMemo(
    () =>
      lines.map((ln) => {
        const cells: Record<string, string> = { Vendor: orgNameById.get(ln.organization_id) ?? '' };
        for (const [label, key] of dataKeyByLabel) {
          cells[label] = ln.data[key] ?? '';
        }
        return { id: ln.id, orgId: ln.organization_id, cells };
      }),
    [lines, orgNameById, dataKeyByLabel],
  );

  const draftToData = (draft: Record<string, string>): Record<string, string> => {
    const data: Record<string, string> = {};
    for (const [label, key] of dataKeyByLabel) {
      const v = (draft[label] ?? '').trim();
      if (v) data[key] = v;
    }
    return data;
  };

  const onAdd = async (draft: Record<string, string>): Promise<boolean> => {
    const orgId = orgIdByName.get((draft.Vendor ?? '').trim());
    if (!orgId) {
      setNote('Vendor is required - create a vendor organization first.');
      return false;
    }
    try {
      const res = await fetch('/api/organizations/' + orgId + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ line_group: lineGroup, data: draftToData(draft) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setNote(j?.error?.message ?? 'Failed to add line.');
        return false;
      }
      setNote('Integration added.');
      void load();
      return true;
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Failed to add line.');
      return false;
    }
  };

  const onUpdate = async (id: string, draft: Record<string, string>): Promise<boolean> => {
    const row = rows.find((r) => r.id === id);
    if (!row) return false;
    try {
      const res = await fetch('/api/organizations/' + row.orgId + '/lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ line_id: id, line_group: lineGroup, data: draftToData(draft) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setNote(j?.error?.message ?? 'Failed to update line.');
        return false;
      }
      setNote('Integration updated.');
      void load();
      return true;
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Failed to update line.');
      return false;
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    try {
      const res = await fetch(
        '/api/organizations/' +
          row.orgId +
          '/lines?line_id=' +
          encodeURIComponent(id) +
          '&line_group=' +
          encodeURIComponent(lineGroup),
        { method: 'DELETE', credentials: 'include' },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setNote(j?.error?.message ?? 'Failed to delete line.');
        return;
      }
      setNote('Integration deleted.');
      void load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Failed to delete line.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
          <p className='text-sm text-muted-foreground'>Loading integrations...</p>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
          <p className='text-sm font-medium text-destructive'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-3'>
      <EntityListing<Record<string, unknown> & { id: string; orgId: string; cells: Record<string, string> }>
        summary={
          summary ??
          'Organization-attached lines (record_line.organization_id + line_group).'
        }
        accent={accent}
        fields={listingFields}
        rows={rows as unknown as (Record<string, unknown> & { id: string; orgId: string; cells: Record<string, string> })[]}
        getRowId={(r) => r.id}
        getCell={(r, key) => r.cells[key] ?? ''}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        emptyLabel={'No ' + lineGroup + ' lines yet - add the first one below.'}
        columnStorageKey={`mc.listing.zone.lines.${lineGroup}`}
      />
      {note && <p className='pt-2 text-xs text-muted-foreground'>{note}</p>}
    </div>
  );
}

function ListingPanel({
  panel,
  accent,
  headerRecordId: headerRecordIdProp,
  onHeaderRecord,
  viewMode = "lines",
  onRowOpen,
}: {
  panel: ZoneTab;
  accent: string;
  headerRecordId?: string | null;
  onHeaderRecord?: (id: string | null) => void;
  /** #185 Slice A (rev E section 7.3): "instances" renders the header-instance
   *  list (list view of list-to-detail); "lines" renders the lines table of
   *  the bound header record (I2 default). */
  viewMode?: "instances" | "lines";
  /** #185 Slice A: row-click detail navigation (instances view only). */
  onRowOpen?: (recordId: string) => void;
}) {
  type CatalogField = {
    api_name: string;
    label: string;
    data_type: string;
    value_set_api_name?: string | null;
    active?: boolean;
    is_required?: boolean;
    zone_role?: "header" | "list" | null;
    show_in_column?: boolean;
  };

  const isDynamic = !!panel.recordTypeApiName;
  const objectApiName = panel.objectApiName || panel.recordTypeApiName || "";
  const [catalogFields, setCatalogFields] = useState<CatalogField[]>([]);
  const runtime = useSavedRuntimeLayouts(
    isDynamic ? objectApiName : "",
    isDynamic ? catalogFields : undefined,
  );
  const [fieldsLoading, setFieldsLoading] = useState(false);

  useEffect(() => {
    if (!isDynamic || !panel.recordTypeApiName) {
      return;
    }
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kick loading flag before async catalog fetch
    setFieldsLoading(true);
    const url = "/api/catalog/record-types/" + encodeURIComponent(panel.recordTypeApiName);
    void fetch(url, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load field definitions");
        return response.json();
      })
      .then((payload: { data?: { fields?: CatalogField[] } }) => {
        const next = (payload.data?.fields ?? []).filter((f) => f.active !== false);
        setCatalogFields(next);
        setFieldsLoading(false);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setCatalogFields([]);
          setFieldsLoading(false);
        }
      });
    return () => controller.abort();
  }, [isDynamic, panel.recordTypeApiName]);

  const columns = useMemo(() => {
    if (isDynamic && catalogFields.length > 0) {
      // O1: explicit per-field column control. A list-zone field is a column
      // only when show_in_column is true (explicit, not first-only). Header
      // fields never appear as lines-table columns. Non-header_lines types
      // keep the legacy first-four behavior.
      const isHeaderLines = panel.structure === "header_lines";
      if (isHeaderLines) {
        // #185 Slice A: instances view (list-to-detail list view) shows the
        // header fields as columns; lines view keeps the O1 list columns.
        if (viewMode === "instances") {
          return catalogFields
            .filter((f) => f.zone_role === "header")
            .map((f) => f.label);
        }
        return catalogFields
          .filter((f) => f.zone_role === "list" && f.show_in_column === true)
          .map((f) => f.label);
      }
      return catalogFields.slice(0, 4).map((f) => f.label);
    }
    if (panel.listColumns && panel.listColumns.length > 0) {
      return panel.listColumns;
    }
    return panel.fields.slice(0, 4).map((f) => f.label);
  }, [isDynamic, catalogFields, panel.listColumns, panel.fields, panel.structure, viewMode]);

  const fields: ListingField[] = useMemo(() => {
    if (isDynamic && catalogFields.length > 0) {
      const colSet = new Set(columns);
      const byApi = new Map(catalogFields.map((f) => [f.api_name, f]));
      // Prefer saved edit layout field order when present (runtime effect of Layout Editor).
      const orderedApis: string[] = [];
      for (const sec of runtime.edit) {
        for (const f of sec.fields) {
          if (byApi.has(f.key) && !orderedApis.includes(f.key)) orderedApis.push(f.key);
        }
      }
      for (const f of catalogFields) {
        if (!orderedApis.includes(f.api_name)) orderedApis.push(f.api_name);
      }
      const spanByApi = new Map<string, 1 | 2>();
      for (const sec of runtime.edit) {
        for (const f of sec.fields) {
          if (f.span === 2) spanByApi.set(f.key, 2);
        }
      }
      return orderedApis
        .map((api) => {
          const f = byApi.get(api)!;
          return {
            key: f.api_name,
            label: f.label,
            kind: dataTypeToUiKind(f.data_type as CatalogDataType),
            column: colSet.has(f.label) || colSet.has(f.api_name),
            span: spanByApi.get(api) ?? 1,
            required: f.is_required,
            zoneRole: (f as { zone_role?: "header" | "list" | null }).zone_role ?? null,
          };
        })
        // #185 Slice A: instances view keeps header fields (the instance form);
        // lines view filters to list-zone fields (the line editor).
        if (viewMode === "instances") {
          return orderedApis
            .map((api) => {
              const f = byApi.get(api)!;
              return {
                key: f.api_name,
                label: f.label,
                kind: dataTypeToUiKind(f.data_type as CatalogDataType),
                column: colSet.has(f.label) || colSet.has(f.api_name),
                span: spanByApi.get(api) ?? 1,
                required: f.is_required,
                zoneRole: (f as { zone_role?: "header" | "list" | null }).zone_role ?? null,
              };
            })
            .filter((f) => f.zoneRole == null || f.zoneRole === "header");
        }
        return orderedApis
          .map((api) => {
            const f = byApi.get(api)!;
            return {
              key: f.api_name,
              label: f.label,
              kind: dataTypeToUiKind(f.data_type as CatalogDataType),
              column: colSet.has(f.label) || colSet.has(f.api_name),
              span: spanByApi.get(api) ?? 1,
              required: f.is_required,
              zoneRole: (f as { zone_role?: "header" | "list" | null }).zone_role ?? null,
            };
          })
          .filter((f) => f.zoneRole == null || f.zoneRole === "list");
      }
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
  }, [isDynamic, catalogFields, panel.fields, columns, runtime.edit, viewMode]);

  const seedRows: ZoneListRow[] = useMemo(() => {
    const seed: string[][] =
      panel.sampleRows && panel.sampleRows.length > 0
        ? panel.sampleRows.map((r) => [...r])
        : [
            columns.map((_, i) => (i === 0 ? ("Sample " + panel.label + " A") : "-")),
            columns.map((_, i) => (i === 0 ? ("Sample " + panel.label + " B") : "-")),
          ];
    return seed.map((cells, idx) => {
      const rec: Record<string, string> = {};
      columns.forEach((c, i) => {
        rec[c] = cells[i] === "-" ? "" : (cells[i] ?? "");
      });
      return { id: panel.id + "-row-" + idx, cells: rec };
    });
  }, [panel.id, panel.sampleRows, panel.label, columns]);

  const [rows, setRows] = useState<ZoneListRow[]>(seedRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** J2/N2: for header_lines, the header record id that owns the lines array.
   *  Controlled from TabPanel so a header saved in the same session (FormPanel)
   *  is immediately visible here without a full page refresh. */
  const headerRecordId = headerRecordIdProp ?? null;
  const isHeaderLines = panel.structure === "header_lines";
  // #185 Slice A (rev E section 4.2): the lines group this tab edits. First
  // list-zone field's api_name prefix (milestone_/subtask_/variant_/rate_)
  // names the group; policy keeps its legacy default group.
  const linesGroupApiName = useMemo(() => {
    const firstList = catalogFields.find((f) => f.zone_role === "list");
    if (!firstList) return undefined;
    const prefix = firstList.api_name.split("_")[0];
    return prefix === "line" ? undefined : prefix + "s";
  }, [catalogFields]);

  const toCells = useCallback(
    (inst: { id: string; name?: string; status?: string; data?: Record<string, string> }) => {
      const data = (inst.data ?? {}) as Record<string, string>;
      const cells: Record<string, string> = { ...data };
      cells.Name = inst.name ?? data.Name ?? data.name ?? "";
      cells.name = cells.Name;
      cells.Status = inst.status ?? data.Status ?? data.status ?? "";
      cells.status = cells.Status;
      for (const f of catalogFields) {
        if (f.api_name === "name") cells[f.api_name] = cells.Name;
        else if (f.api_name === "status") cells[f.api_name] = cells.Status;
        else if (cells[f.api_name] == null) {
          cells[f.api_name] = data[f.api_name] ?? data[f.label] ?? "";
        }
      }
      return cells;
    },
    [catalogFields],
  );

  useEffect(() => {
    if (!isDynamic) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kick loading flag before async records fetch
    setLoading(true);
    // #185 Slice A: when the header record is already bound (list-to-detail
    // detail view), fetch it directly - the bound record is not necessarily
    // the first instance of the type.
    if (isHeaderLines && headerRecordId) {
      fetch("/api/records/" + headerRecordId, { credentials: "include" })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch record");
          return r.json();
        })
        .then((json) => {
          const inst = json.data as { id: string; lines?: Array<{ id: string; data?: Record<string, string> }> } | null;
          const lineRows: ZoneListRow[] = (inst?.lines ?? []).map((ln) => ({
            id: ln.id,
            cells: toCells({ id: ln.id, data: ln.data ?? {} }),
          }));
          setRows(lineRows);
          setLoading(false);
        })
        .catch((e) => {
          setError(e.message);
          setLoading(false);
        });
      return;
    }
    const params = new URLSearchParams();
    params.set("type", panel.recordTypeApiName!);
    params.set("parent_kind", panel.parentKind!);
    params.set("parent", panel.parentApiName!);
    fetch("/api/records?" + params.toString(), { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch records");
        return r.json();
      })
      .then((json) => {
        const all = (json.data ?? []) as Array<{ id: string; name?: string; status?: string; data?: Record<string, string>; lines?: Array<{ id: string; data?: Record<string, string> }> }>;
        if (viewMode === "instances") {
          // #185 Slice A (rev E section 7.3): list view of list-to-detail —
          // every instance is a row; row click opens the detail view.
          onHeaderRecord?.(null);
          setRows(all.map((inst) => ({ id: inst.id, cells: toCells(inst) })));
        } else if (isHeaderLines) {
          // J2: header_lines — the header record owns the lines array; never
          // surface the header itself as a line row.
          const header = all[0];
          onHeaderRecord?.(header?.id ?? null);
          const lineRows: ZoneListRow[] = (header?.lines ?? []).map((ln) => ({
            id: ln.id,
            cells: toCells({ id: ln.id, data: ln.data ?? {} }),
          }));
          setRows(lineRows);
        } else {
          onHeaderRecord?.(null);
          setRows(all.map((inst) => ({ id: inst.id, cells: toCells(inst) })));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [isDynamic, panel.recordTypeApiName, panel.parentKind, panel.parentApiName, seedRows, catalogFields, isHeaderLines, toCells, onHeaderRecord, viewMode, headerRecordId]);

  const validateRequired = (draft: Record<string, string>): string => {
    if (!isDynamic) return "";
    for (const f of catalogFields) {
      if (!f.is_required) continue;
      // K2: on header_lines, header-placed required fields must NOT block the
      // lines editor. In instances view (list-to-detail list view) the draft
      // IS the header record, so required header fields apply normally.
      if (
        isHeaderLines &&
        viewMode !== "instances" &&
        (f as { zone_role?: "header" | "list" | null }).zone_role === "header"
      ) {
        continue;
      }
      const v = (draft[f.api_name] ?? "").trim();
      if (!v) return f.label + " is required.";
    }
    return "";
  };

  const onDelete = async (id: string) => {
    if (!isDynamic || id.startsWith(panel.id)) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    if (viewMode === "instances") {
      // #185 Slice A (rev E section 7.3): instances view deletes the header
      // record (its lines cascade with it).
      try {
        const res = await fetch("/api/records/" + id, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to delete record");
        setRows((prev) => prev.filter((r) => r.id !== id));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : String(e));
      }
      return;
    }
    try {
      if (isHeaderLines) {
        // J2: remove a line from the header record's lines array.
        if (!headerRecordId) return false;
        // #185 Slice A (rev E section 4.2): lines carry their group api_name.
        const nextLines = rows
          .filter((r) => r.id !== id)
          .map((r) => ({ line_group: linesGroupApiName, data: r.cells }));
        const res = await fetch("/api/records/" + headerRecordId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lines: nextLines }),
        });
        if (!res.ok) throw new Error("Failed to delete line");
        const json = await res.json();
        const inst = json.data;
        const lineRows: ZoneListRow[] = (inst.lines ?? []).map((ln: { id: string; data?: Record<string, string> }) => ({
          id: ln.id,
          cells: toCells({ id: ln.id, data: ln.data ?? {} }),
        }));
        setRows(lineRows);
        return true;
      }
      const res = await fetch("/api/records/" + id, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const onAdd = async (draft: Record<string, string>): Promise<boolean> => {
    if (!isDynamic) {
      const id = panel.id + "-row-" + (rows.length + 1);
      setRows((prev) => [...prev, { id, cells: draft }]);
      return true;
    }
    const requiredError = validateRequired(draft);
    if (requiredError) {
      alert(requiredError);
      return false;
    }
    if (viewMode === "instances") {
      // #185 Slice A (rev E section 7.3): instances view creates a new header
      // record (list-to-detail), not a line on a shared header.
      try {
        const name = draft.name || draft.Name || "New Record";
        const status = draft.status || draft.Status || "active";
        const data: Record<string, string> = { ...draft };
        delete data.Name;
        delete data.Status;
        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type_api_name: panel.recordTypeApiName,
            parent_kind: panel.parentKind,
            parent_api_name: panel.parentApiName,
            name,
            status,
            data,
          }),
        });
        if (!res.ok) throw new Error("Failed to create record");
        const json = await res.json();
        const inst = json.data;
        setRows((prev) => [...prev, { id: inst.id, cells: toCells(inst) }]);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : String(e));
        return false;
      }
      return true;
    }
    try {
      const name = draft.name || draft.Name || "New Record";
      const status = draft.status || draft.Status || "active";
      const data: Record<string, string> = { ...draft };
      delete data.Name;
      delete data.Status;
      if (isHeaderLines) {
        // J2: add a line to the header record's lines array (never a new record).
        if (!headerRecordId) {
          alert("Save the header first, then add lines.");
          return false;
        }
        const res = await fetch("/api/records/" + headerRecordId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // #185 Slice A (rev E section 4.2): lines carry their group api_name.
          body: JSON.stringify({
            lines: [
              ...rows.map((r) => ({ line_group: linesGroupApiName, data: r.cells })),
              { line_group: linesGroupApiName, data },
            ],
          }),
        });
        if (!res.ok) throw new Error("Failed to add line");
        const json = await res.json();
        const inst = json.data;
        const lineRows: ZoneListRow[] = (inst.lines ?? []).map((ln: { id: string; data?: Record<string, string> }) => ({
          id: ln.id,
          cells: toCells({ id: ln.id, data: ln.data ?? {} }),
        }));
        setRows(lineRows);
        return true;
      }
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type_api_name: panel.recordTypeApiName,
          parent_kind: panel.parentKind,
          parent_api_name: panel.parentApiName,
          name,
          status,
          data,
        }),
      });
      if (!res.ok) throw new Error("Failed to create record");
      const json = await res.json();
      const inst = json.data;
      const cells: Record<string, string> = {
        ...(inst.data ?? {}),
        Name: inst.name,
        name: inst.name,
        Status: inst.status,
        status: inst.status,
      };
      for (const f of catalogFields) {
        if (cells[f.api_name] == null) cells[f.api_name] = "";
      }
      setRows((prev) => [...prev, { id: inst.id, cells }]);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
      return false;
    }
    return true;
  };

  const onUpdate = async (id: string, draft: Record<string, string>): Promise<boolean> => {
    if (!isDynamic || id.startsWith(panel.id)) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, cells: draft } : r)));
      return true;
    }
    const requiredError = validateRequired(draft);
    if (requiredError) {
      alert(requiredError);
      return false;
    }
    if (viewMode === "instances") {
      // #185 Slice A (rev E section 7.3): instances view edits the header record.
      try {
        const name = draft.name || draft.Name;
        const status = draft.status || draft.Status;
        const data: Record<string, string> = { ...draft };
        delete data.Name;
        delete data.Status;
        const res = await fetch("/api/records/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, status, data }),
        });
        if (!res.ok) throw new Error("Failed to update record");
        const json = await res.json();
        const inst = json.data;
        setRows((prev) => prev.map((r) => (r.id === id ? { id: inst.id, cells: toCells(inst) } : r)));
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : String(e));
        return false;
      }
      return true;
    }
    try {
      const name = draft.name || draft.Name;
      const status = draft.status || draft.Status;
      const data: Record<string, string> = { ...draft };
      delete data.Name;
      delete data.Status;
      if (isHeaderLines) {
        // J2: update a line within the header record's lines array.
        if (!headerRecordId) return false;
        // #185 Slice A (rev E section 4.2): lines carry their group api_name.
        const nextLines = rows.map((r) =>
          r.id === id
            ? { line_group: linesGroupApiName, data }
            : { line_group: linesGroupApiName, data: r.cells },
        );
        const res = await fetch("/api/records/" + headerRecordId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lines: nextLines }),
        });
        if (!res.ok) throw new Error("Failed to update line");
        const json = await res.json();
        const inst = json.data;
        const lineRows: ZoneListRow[] = (inst.lines ?? []).map((ln: { id: string; data?: Record<string, string> }) => ({
          id: ln.id,
          cells: toCells({ id: ln.id, data: ln.data ?? {} }),
        }));
        setRows(lineRows);
        return true;
      }
      const res = await fetch("/api/records/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, status, data }),
      });
      if (!res.ok) throw new Error("Failed to update record");
      const json = await res.json();
      const inst = json.data;
      const cells: Record<string, string> = {
        ...(inst.data ?? {}),
        Name: inst.name,
        name: inst.name,
        Status: inst.status,
        status: inst.status,
      };
      for (const f of catalogFields) {
        if (cells[f.api_name] == null) cells[f.api_name] = draft[f.api_name] ?? "";
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { id: inst.id, cells } : r)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      {(loading || fieldsLoading) && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          Loading records...
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !fieldsLoading && (
        <EntityListing
          summary={panel.summary}
          accent={accent}
          fields={fields}
          rows={rows}
          getRowId={(r) => r.id}
          getCell={(r, k) => r.cells[k] ?? ""}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
          columnStorageKey={`mc.listing.zone.${panel.id}`}
          onRowOpen={
            viewMode === "instances" && onRowOpen
              ? (row) => onRowOpen(row.id)
              : undefined
          }
          badgeLabel={isDynamic ? "Dynamic Record" : "Listing"}
        />
      )}
    </div>
  );
}


function FormPanel({
  panel,
  accent,
  onHeaderSaved,
  detailRecordId,
}: {
  panel: ZoneTab;
  accent: string;
  onHeaderSaved?: (id: string) => void;
  /** #185 Slice A (rev E section 7.3): when set, the form edits THIS record
   *  (list-to-detail detail view) instead of the parent-shared header. */
  detailRecordId?: string | null;
}) {
  type CatalogField = { api_name: string; label: string; data_type: string; value_set_api_name?: string | null; active?: boolean; is_required?: boolean };
  const isDynamic = !!panel.recordTypeApiName;
  const objectApiName = panel.objectApiName || panel.recordTypeApiName || "";
  const [catalogFields, setCatalogFields] = useState<CatalogField[]>([]);
  const runtime = useSavedRuntimeLayouts(
    isDynamic ? objectApiName : "",
    isDynamic ? catalogFields : undefined,
  );
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  // N3: view/edit/save-cancel for field-bearing surfaces.
  const [editing, setEditing] = useState(false);
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  // #249 Slice E2 (rev E section 2.5): owning organization per record -
  // auto-preset at creation from the Primary Org; shown read-only here.
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/organizations", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: Array<{ id: string; name?: string; is_primary?: boolean; org_type?: string; data?: Record<string, unknown> }> }) => {
        const rows = json.data ?? [];
        const primary =
          rows.find((o) => o.is_primary || o.data?.is_primary === true) ??
          rows.find((o) => o.org_type === "internal") ??
          rows[0];
        setOrgOptions(rows.map((o) => ({ id: o.id, name: o.name ?? o.id })));
        if (primary) setOrgId(primary.id);
      })
      .catch(() => setOrgOptions([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isDynamic || !panel.recordTypeApiName) {
      return;
    }
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kick loading flag before async catalog fetch
    setFieldsLoading(true);
    const url = "/api/catalog/record-types/" + encodeURIComponent(panel.recordTypeApiName);
    void fetch(url, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load field definitions");
        return response.json();
      })
      .then((payload: { data?: { fields?: CatalogField[] } }) => {
        const next = (payload.data?.fields ?? []).filter((f) => f.active !== false);
        setCatalogFields(next);
        setValues((prev) => {
          const draft = { ...prev };
          for (const f of next) {
            if (draft[f.api_name] == null) draft[f.api_name] = "";
          }
          return draft;
        });
        setFieldsLoading(false);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setCatalogFields([]);
          setFieldsLoading(false);
        }
      });
    return () => controller.abort();
  }, [isDynamic, panel.recordTypeApiName]);

  // O2: built-in config tabs persist edits to localStorage (view/edit/save-cancel).
  const configStorageKey = `mc.config.${panel.id}`;
  useEffect(() => {
    if (isDynamic) return;
    try {
      const raw = localStorage.getItem(configStorageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, string>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate built-in config from localStorage once
        setValues(saved);
        setSavedValues(saved);
      } else {
        const seed: Record<string, string> = {};
        for (const f of panel.fields) seed[f.label] = "";
        setValues(seed);
        setSavedValues(seed);
      }
    } catch {
      const seed: Record<string, string> = {};
      for (const f of panel.fields) seed[f.label] = "";
      setValues(seed);
      setSavedValues(seed);
    }
  }, [isDynamic, configStorageKey, panel.fields]);

  // I2: load existing header instance (single record per parent+type) if present.
  // #185 Slice A: in list-to-detail detail view, load the selected record
  // directly by id instead of the parent-shared first record.
  useEffect(() => {
    if (!isDynamic || !panel.recordTypeApiName) {
      return;
    }
    if (detailRecordId) {
      const controller = new AbortController();
      void fetch("/api/records/" + detailRecordId, { credentials: "include", signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { data: null }))
        .then((json) => {
          const inst = json.data as { id: string; name?: string; status?: string; data?: Record<string, string>; org_id?: string } | null;
          if (inst) {
            setInstanceId(inst.id);
            const data = (inst.data ?? {}) as Record<string, string>;
            const draft: Record<string, string> = { ...data };
            draft.name = inst.name ?? data.name ?? "";
            draft.status = inst.status ?? data.status ?? "";
            setValues(draft);
            setSavedValues(draft);
            setOrgId(inst.org_id ?? "");
          }
        })
        .catch(() => {
          /* detail load failure is non-fatal; user can still save */
        });
      return () => controller.abort();
    }
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("type", panel.recordTypeApiName);
    params.set("parent_kind", panel.parentKind!);
    params.set("parent", panel.parentApiName!);
    void fetch("/api/records?" + params.toString(), { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        const rows = (json.data ?? []) as Array<{ id: string; name?: string; status?: string; data?: Record<string, string> }>;
        if (rows.length > 0) {
          const inst = rows[0];
          setInstanceId(inst.id);
          const data = (inst.data ?? {}) as Record<string, string>;
          const draft: Record<string, string> = { ...data };
          draft.name = inst.name ?? data.name ?? "";
          draft.status = inst.status ?? data.status ?? "";
          setValues(draft);
          setSavedValues(draft);
        }
      })
      .catch(() => {
        /* header load failure is non-fatal; user can still save a new record */
      });
    return () => controller.abort();
  }, [isDynamic, panel.recordTypeApiName, panel.parentKind, panel.parentApiName, detailRecordId]);

  const fallbackSections = useMemo(() => {
    const fields = (isDynamic && catalogFields.length > 0
      ? catalogFields.map((f) => {
          const { options, optionLabels } = optionsForField(f);
          return {
            key: f.api_name,
            label: f.label,
            kind: dataTypeToUiKind(f.data_type as CatalogDataType),
            options,
            optionLabels,
            required: f.is_required,
            zoneRole: (f as { zone_role?: "header" | "list" | null }).zone_role ?? null,
          };
        })
      : panel.fields.map((f) => ({
          key: f.label,
          label: f.label,
          kind: (f.kind ?? "text") as "text" | "textarea" | "select",
          options: f.options,
          optionLabels: undefined,
          required: undefined,
          zoneRole: null,
        })));
    return [
      {
        id: "zone-default",
        label: panel.label || "General",
        columns: 2 as const,
        fields: filterByZoneRole(fields, "header"),
      },
    ];
  }, [isDynamic, catalogFields, panel.fields, panel.label]);

  const sections =
    isDynamic &&
    objectApiName &&
    runtime.edit.length &&
    runtime.edit.some((sec) => sec.fields.length > 0)
      ? runtime.edit
          .map((sec) => ({ ...sec, fields: filterByZoneRole(sec.fields, "header") }))
          .filter((sec) => sec.fields.length > 0)
      : fallbackSections;

  const loading = fieldsLoading || (isDynamic && runtime.loading);

  const validateRequired = (): string => {
    if (!isDynamic) return "";
    const isHeaderLines = panel.structure === "header_lines";
    for (const f of catalogFields) {
      if (!f.is_required) continue;
      // J4 hygiene: on header_lines, list-only fields are not part of the header form.
      if (isHeaderLines && (f as { zone_role?: "header" | "list" | null }).zone_role === "list") continue;
      const v = (values[f.api_name] ?? "").trim();
      if (!v) return f.label + " is required.";
    }
    return "";
  };

  const onSave = async () => {
    if (!isDynamic) {
      // O2: built-in config tabs persist to localStorage.
      try {
        localStorage.setItem(configStorageKey, JSON.stringify(values));
      } catch {
        /* ignore quota/security errors */
      }
      setSavedValues(values);
      setEditing(false);
      setSaveStatus("Saved");
      return;
    }
    const requiredError = validateRequired();
    if (requiredError) {
      setSaveError(requiredError);
      setSaveStatus("");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveStatus("");
    try {
      const data: Record<string, string> = { ...values };
      const name = data.name || data.Name || panel.label;
      const status = data.status || data.Status || "active";
      delete data.Name;
      delete data.Status;
      let res: Response;
      if (instanceId || detailRecordId) {
        const targetId = instanceId ?? detailRecordId;
        res = await fetch("/api/records/" + targetId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            status,
            data,
            // #249 Slice E2 (rev E section 2.5): org move per record.
            org_id: orgId || undefined,
          }),
        });
      } else {
        res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type_api_name: panel.recordTypeApiName,
            parent_kind: panel.parentKind,
            parent_api_name: panel.parentApiName,
            name,
            status,
            data,
          }),
        });
      }
      if (!res.ok) throw new Error("Failed to save record");
      const json = await res.json();
      const inst = json.data;
      setInstanceId(inst.id);
      setSaveStatus("Saved");
      setSavedValues(values);
      setEditing(false);
      onHeaderSaved?.(inst.id);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{panel.summary}</p>
          </div>
          <ListingBadge label={isDynamic ? "Dynamic Record" : "Configure"} accent={accent} />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading fields...</p>
        ) : (
          <>
            <LayoutDrivenForm
              sections={sections}
              values={values}
              onChange={(key, value) => setValues((d) => ({ ...d, [key]: value }))}
              readOnly={!editing}
              accent={accent}
            />
            {isDynamic && (orgOptions.find((o) => o.id === orgId)?.name || orgOptions[0]?.name) ? (
              <div className="mt-4">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Primary Org
                  </span>
                  <input
                    className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                    value={orgOptions.find((o) => o.id === orgId)?.name ?? orgOptions[0]?.name ?? ""}
                    readOnly
                  />
                </label>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => {
                    setSavedValues(values);
                    setEditing(true);
                  }}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: accent }}
                >
                  {isDynamic ? (instanceId ? "Edit" : "Create") : "Edit"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    style={{ backgroundColor: accent }}
                  >
                    {saving ? "Saving..." : isDynamic ? (instanceId ? "Save changes" : "Save") : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValues(savedValues);
                      setSaveError("");
                      setSaveStatus("");
                      setEditing(false);
                    }}
                    disabled={saving}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                </>
              )}
              {saveStatus && (
                <span className="text-sm text-emerald-600">{saveStatus}</span>
              )}
              {saveError && (
                <span className="text-sm text-destructive">{saveError}</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


function TabPanel({
  tab,
  accent,
  childId,
  setChildId,
  hideSubTabs = false,
}: {
  tab: ZoneTab;
  accent: string;
  childId: string;
  setChildId: (id: string) => void;
  hideSubTabs?: boolean;
}) {
  const isOrganizationsSelf = tab.id === "executive";
  const isOrgConfiguration = tab.id === "org-configuration";
  const subTabs = useMemo(() => zoneSubTabs(tab), [tab]);

  const activeChild = useMemo(() => {
    if (!subTabs?.length) return null;
    return subTabs.find((c) => c.id === childId) ?? subTabs[0];
  }, [subTabs, childId]);

  const panel = activeChild ?? tab;
  const presentation = panel.presentation ?? "form";
  const structure = panel.structure;

  // I2: header_lines = saveable header FormPanel ABOVE a lines ListingPanel.
  const isHeaderLines = structure === "header_lines";
  // N2: header record id lifted here so a header saved in FormPanel (same
  // session) is immediately visible to ListingPanel without a full refresh.
  const [headerRecordId, setHeaderRecordId] = useState<string | null>(null);
  // #185 Slice A (rev E section 7.3): list-to-detail for header_lines types.
  // #247 Slice B (Gate 3 amendment, 2026-08-31): the shape rule is UNIVERSAL -
  // no header/config forms anywhere; policy renders list-to-detail exactly
  // like projects/tasks (COA ruling D3 superseded). null = list view
  // (instance list); set = detail view.
  const isListToDetail = isHeaderLines && panel.recordTypeApiName != null;
  const [detailRecordId, setDetailRecordId] = useState<string | null>(null);
  const detailPanel = useMemo(
    () => (detailRecordId ? { ...panel, id: panel.id + "-detail" } : panel),
    [panel, detailRecordId],
  );

  // I5.6.34 — sub-tab strip + description in stable position; body only changes
  return (
    <div className="space-y-3">
      {!hideSubTabs ? (
      <SubTabBar
        items={subTabs}
        activeId={panel.id}
        accent={accent}
        onSelect={setChildId}
        ariaLabel={`${tab.label} sub-elements`}
      />
      ) : null}
      {isOrgConfiguration ? (
        <div className="space-y-4">
          <PrimaryOrgPanel accent={accent} />
          <DivisionConfigPanel
            divisionId="executive"
            divisionLabel="Organization"
            accent={accent}
          />
        </div>
      ) : panel.orgLinesGroup ? (
        <OrgLinesPanel
          orgType={panel.orgTypePanel ?? 'vendor'}
          lineGroup={panel.orgLinesGroup}
          fields={panel.fields}
          listColumns={panel.listColumns}
          accent={accent}
          summary={panel.summary}
        />
      ) : panel.orgTypePanel ? (
        <OrgTypeListingPanel orgType={panel.orgTypePanel} accent={accent} summary={panel.summary} />
      ) : isOrganizationsSelf && panel.id === tab.id ? (
        <OrganizationsPanel accent={accent} />
      ) : isListToDetail ? (
        detailRecordId ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setDetailRecordId(null)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              &larr; Back to {panel.label}
            </button>
            <FormPanel
              key={detailRecordId}
              panel={detailPanel}
              accent={accent}
              detailRecordId={detailRecordId}
            />
            {/* #249 Slice E2 (rev E section 3.2): both-way relation navigation
                on executive detail pages (policy/projects/tasks). */}
            <RecordRelationsPanel key={detailRecordId} recordId={detailRecordId} accent={accent} />
            <ListingPanel
              panel={detailPanel}
              accent={accent}
              headerRecordId={detailRecordId}
            />
          </div>
        ) : (
          <ListingPanel
            panel={panel}
            accent={accent}
            viewMode="instances"
            onRowOpen={(recordId) => setDetailRecordId(recordId)}
          />
        )
      ) : isHeaderLines ? (
        <div className="space-y-4">
          <FormPanel
            panel={panel}
            accent={accent}
            onHeaderSaved={(id) => setHeaderRecordId(id)}
          />
          <ListingPanel
            panel={panel}
            accent={accent}
            headerRecordId={headerRecordId}
            onHeaderRecord={setHeaderRecordId}
          />
        </div>
      ) : presentation === "listing" ? (
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
      return { tabId: t.id, childId: defaultChildIdForTab(t) };
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
  const tabs = useMemo(() => organizationTabs(config), [config]);
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [childId, setChildId] = useState(() =>
    tabs[0] ? defaultChildIdForTab(tabs[0]) : "",
  );
  const skipChildResetRef = useRef(false);

  const tab = useMemo(
    () => tabs.find((t) => t.id === active) ?? tabs[0],
    [active, tabs]
  );

  useEffect(() => {
    if (skipChildResetRef.current) {
      skipChildResetRef.current = false;
      return;
    }
    const next = tabs.find((t) => t.id === active);
    setChildId(next ? defaultChildIdForTab(next) : active);
  }, [active, tabs]);

  const subTabs = useMemo(() => (tab ? zoneSubTabs(tab) : []), [tab]);

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

  const twinAnimSpeed = 0;
  const hubZone = isHubZone(config.id) ? config.id : null;

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
    <div className="space-y-3">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        accent={config.accent}
        tabs={tabs.map((t) => ({
          id: t.id,
          label: t.label,
          count:
            t.children && t.children.length > 0
              ? NO_RECORDS_SELF_TAB.has(t.id)
                ? t.children.length
                : t.children.length + 1
              : undefined,
        }))}
        tabsValue={tab?.id ?? ""}
        onTabChange={selectTab}
        tabsAriaLabel={`${config.title} elements`}
      />

      {tab && subTabs.length > 0 ? (
        <SubTabBar
          items={subTabs}
          activeId={subTabs.find((c) => c.id === childId)?.id ?? subTabs[0].id}
          accent={config.accent}
          onSelect={setChildId}
          ariaLabel={`${tab.label} sub-elements`}
        />
      ) : null}

      <div className="relative flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          {tab && (
            <TabPanel
              key={active + ":" + childId}
              tab={tab}
              accent={config.accent}
              childId={childId}
              setChildId={setChildId}
              hideSubTabs
            />
          )}
        </div>

        {hubZone ? (
          <>
            <div className="relative flex shrink-0 items-stretch" style={{ paddingLeft: 10 }}>
              <button
                type="button"
                onClick={() => setTwinOpenPersist(!twinOpen)}
                className="z-10 flex h-20 w-5 shrink-0 self-center items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                aria-pressed={twinOpen}
                aria-controls={`spatial-twin-drawer-${config.id}`}
                title={twinOpen ? "Collapse spatial twin" : "Expand spatial twin"}
              >
                {twinOpen ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span className="sr-only">{twinOpen ? "Collapse twin" : "Expand twin"}</span>
              </button>
            </div>
            {twinOpen ? (
              <div
                id={`spatial-twin-drawer-${config.id}`}
                className="flex min-h-[200px] w-full shrink-0 flex-col lg:min-h-[260px] lg:w-[465px]"
                data-hydrated={twinHydrated ? "1" : "0"}
              >
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
                    cameraFitZone={hubZone}
                    zoneVisible={{
                      organization: hubZone === 'organization',
                      collaboration: hubZone === 'collaboration',
                      environment: hubZone === 'environment',
                    }}
                    focusedNodeId={focusedNodeId}
                    onNodeClick={handleNodeClick}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Spatial Twin · click spheres{" "}
                  <Link
                    href="/dashboard"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    [Full 3D Hub]
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
