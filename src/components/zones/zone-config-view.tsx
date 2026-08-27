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
import { LayoutDrivenForm } from "@/components/catalog/layout-driven-form";
import { useSavedRuntimeLayouts } from "@/lib/catalog/use-saved-runtime-layouts";
import { dataTypeToUiKind, optionsForField } from "@/lib/catalog/layout-to-fields";
import type { CatalogDataType } from "@/lib/fixtures/catalog";

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

function ListingPanel({
  panel,
  accent,
}: {
  panel: ZoneTab;
  accent: string;
}) {
  type CatalogField = {
    api_name: string;
    label: string;
    data_type: string;
    value_set_api_name?: string | null;
    active?: boolean;
    is_required?: boolean;
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
      return catalogFields.slice(0, 4).map((f) => f.label);
    }
    if (panel.listColumns && panel.listColumns.length > 0) {
      return panel.listColumns;
    }
    return panel.fields.slice(0, 4).map((f) => f.label);
  }, [isDynamic, catalogFields, panel.listColumns, panel.fields]);

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
  }, [isDynamic, catalogFields, panel.fields, columns, runtime.edit]);

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
  /** J2: for header_lines, the header record id that owns the lines array. */
  const [headerRecordId, setHeaderRecordId] = useState<string | null>(null);
  const isHeaderLines = panel.structure === "header_lines";

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
        if (isHeaderLines) {
          // J2: header_lines — the header record owns the lines array; never
          // surface the header itself as a line row.
          const header = all[0];
          setHeaderRecordId(header?.id ?? null);
          const lineRows: ZoneListRow[] = (header?.lines ?? []).map((ln) => ({
            id: ln.id,
            cells: toCells({ id: ln.id, data: ln.data ?? {} }),
          }));
          setRows(lineRows);
        } else {
          setHeaderRecordId(null);
          setRows(all.map((inst) => ({ id: inst.id, cells: toCells(inst) })));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [isDynamic, panel.recordTypeApiName, panel.parentKind, panel.parentApiName, seedRows, catalogFields, isHeaderLines, toCells]);

  const validateRequired = (draft: Record<string, string>): string => {
    if (!isDynamic) return "";
    for (const f of catalogFields) {
      if (!f.is_required) continue;
      // K2: on header_lines, header-placed required fields must NOT block the list editor.
      if (isHeaderLines && (f as { zone_role?: "header" | "list" | null }).zone_role === "header") continue;
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
    try {
      if (isHeaderLines) {
        // J2: remove a line from the header record's lines array.
        if (!headerRecordId) return false;
        const nextLines = rows.filter((r) => r.id !== id).map((r) => r.cells);
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
          body: JSON.stringify({ lines: [...rows.map((r) => r.cells), data] }),
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
    try {
      const name = draft.name || draft.Name;
      const status = draft.status || draft.Status;
      const data: Record<string, string> = { ...draft };
      delete data.Name;
      delete data.Status;
      if (isHeaderLines) {
        // J2: update a line within the header record's lines array.
        if (!headerRecordId) return false;
        const nextLines = rows.map((r) => (r.id === id ? data : r.cells));
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
          title={panel.label}
          summary={panel.summary}
          accent={accent}
          fields={fields}
          rows={rows}
          getRowId={(r) => r.id}
          getCell={(r, k) => r.cells[k] ?? ""}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
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

  // I2: load existing header instance (single record per parent+type) if present.
  useEffect(() => {
    if (!isDynamic || !panel.recordTypeApiName) {
      return;
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
        }
      })
      .catch(() => {
        /* header load failure is non-fatal; user can still save a new record */
      });
    return () => controller.abort();
  }, [isDynamic, panel.recordTypeApiName, panel.parentKind, panel.parentApiName]);

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
    runtime.detail.length &&
    runtime.detail.some((sec) => sec.fields.length > 0)
      ? runtime.detail
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
    if (!isDynamic) return;
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
      if (instanceId) {
        res = await fetch("/api/records/" + instanceId, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, status, data }),
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
          <Badge
            className="shrink-0 border-0 text-white"
            style={{ backgroundColor: accent }}
          >
            {isDynamic ? "Dynamic Record" : "Configure"}
          </Badge>
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
              accent={accent}
            />
            {isDynamic && (
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={saving}
                  className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {saving ? "Saving..." : instanceId ? "Save changes" : "Save"}
                </button>
                {saveStatus && (
                  <span className="text-sm text-emerald-600">{saveStatus}</span>
                )}
                {saveError && (
                  <span className="text-sm text-destructive">{saveError}</span>
                )}
              </div>
            )}
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
  const structure = panel.structure;

  // I2: header_lines = saveable header FormPanel ABOVE a lines ListingPanel.
  const isHeaderLines = structure === "header_lines";

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
      {isHeaderLines ? (
        <div className="space-y-4">
          <FormPanel panel={panel} accent={accent} />
          <ListingPanel panel={panel} accent={accent} />
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
