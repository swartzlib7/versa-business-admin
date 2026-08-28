"use client";
import { LayoutEditorWrapper } from "@/components/settings/layout-editor-wrapper";

import { useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionTabs } from "@/components/ui/section-tabs";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { theme } from "@/lib/theme";

type Parent = { parent_kind: string; parent_api_name: string; label: string; group?: string; baked_in_tabs: string[] };
type SelectOption = string | { value: string; label: string; group?: string };
type RT = { id?: string; api_name: string; label: string; description?: string; parent_kind: string; parent_api_name: string; structure: string; object_api_name: string; is_system?: boolean; active?: boolean; show_as_tab?: boolean; sort_order?: number };
type FD = { id?: string; api_name: string; label: string; data_type: string; value_set_api_name: string | null; lookup_object_api_name?: string | null; object_api_name?: string; is_system?: boolean; active?: boolean; is_required?: boolean; zone_role?: "header" | "list" | null; show_in_column?: boolean };
type VS = { id?: string; api_name: string; label: string; description?: string; is_system?: boolean };
type VSI = { id: string; api_value: string; label: string; sort_order: number; active: boolean };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || res.statusText);
  return json as T;
}

const DATA_TYPES = ["text", "long_text", "number", "boolean", "date", "datetime", "picklist", "multipicklist", "lookup", "email", "url", "phone"];

/** J3: UI label for a structure value (API value stays header_lines). */
function structureLabel(value: string): string {
  if (value === "header_lines") return "Header and lines";
  if (value === "header") return "Header";
  return "Lines";
}

/** L1: placement cell for the Fields table (Header and lines types only). */
function placementCell(f: FD): ReactNode {
  if (f.zone_role === "header") return <Badge variant="outline" className="text-[10px]">Header</Badge>;
  if (f.zone_role === "list") return <Badge variant="outline" className="text-[10px]">Lines</Badge>;
  return <span className="text-xs text-muted-foreground">—</span>;
}
/* ── Sample data label prefix helper (I5.6.42 #207 C) ── */
function formatSampleLabel(label: string, isSystem: boolean): string {
  return (isSystem ? "(fixed) " : "(db) ") + label;
}

/* ── Standard / DB Core badge ── */
function StandardBadge({ isSystem }: { isSystem: boolean }) {
  if (isSystem) {
    return <Badge className="ml-2 border-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px]">Standard / DB Core</Badge>;
  }
  return <Badge className="ml-2 border-0 bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px]">Custom</Badge>;
}

/* ── Record ID display ── */
function RecordIdDisplay({ id }: { id?: string }) {
  if (!id) return null;
  return <span className="ml-2 font-mono text-[10px] text-muted-foreground">#{id}</span>;
}




/* ── Inline create form ── */
function CreateForm({ fields, accent, onSubmit, onCancel, busy, submitLabel, initialValues }: {
  fields: { key: string; label: string; type?: "text" | "select" | "textarea" | "custom-parent" | "checkbox"; options?: SelectOption[]; placeholder?: string; showWhen?: (vals: Record<string, string>) => boolean }[];
  accent: string;
  onSubmit: (vals: Record<string, string>) => void;
  onCancel: () => void;
  busy: boolean;
  submitLabel: string;
  initialValues?: Record<string, string>;
}) {
  const [vals, setVals] = useState<Record<string, string>>(initialValues ?? {});
  return (
    <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6" style={{ boxShadow: `inset 3px 0 0 ${accent}` }}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((f) => {
          if (f.showWhen && !f.showWhen(vals)) return null;
          const v = vals[f.key] ?? "";
          if (f.type === "checkbox") {
            const checked = v === "true" || v === "on";
            return (
              <label key={f.key} className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-[var(--primary)]"
                  checked={checked}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.checked ? "true" : "" }))}
                />
                <span className="text-sm font-medium">{f.label}</span>
              </label>
            );
          }
          if (f.type === "select") {
            return (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={v}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {(() => {
                    const options = f.options ?? [];
                    const grouped = options.every((option) => typeof option !== "string" && Boolean(option.group));
                    if (grouped) {
                      const groups = new Map<string, Exclude<SelectOption, string>[]>();
                      for (const option of options as Exclude<SelectOption, string>[]) {
                        const group = option.group!;
                        groups.set(group, [...(groups.get(group) ?? []), option]);
                      }
                      return [...groups].map(([group, groupOptions]) => (
                        <optgroup key={group} label={group}>
                          {groupOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </optgroup>
                      ));
                    }
                    return options.map((option) => {
                      const value = typeof option === "string" ? option : option.value;
                      const label = typeof option === "string" ? option : option.label;
                      return <option key={value} value={value}>{label}</option>;
                    });
                  })()}
                </select>
              </label>
            );
          }
          if (f.type === "custom-parent") {
            return (
              <label key={f.key} className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                <select aria-label="Parent" className="w-full rounded-md border-2 border-primary/50 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={v} onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}>
                  <option value="">Select…</option>
                  {(f.options ?? []).every((option) => typeof option !== "string" && Boolean(option.group)) ? [...new Set((f.options ?? []).map((option) => typeof option === "string" ? "Other" : option.group!))].map((group) => <optgroup key={group} label={group}>{(f.options ?? []).filter((option) => typeof option !== "string" && option.group === group).map((option) => typeof option === "string" ? null : <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>) : null}
                </select>
              </label>
            );
          }
          if (f.type === "textarea") {
            return (
              <label key={f.key} className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                <textarea
                  className="min-h-[72px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={f.placeholder}
                  value={v}
                  onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </label>
            );
          }
          return (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={f.placeholder ?? f.label}
                value={v}
                onChange={(e) => setVals((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => onSubmit(vals)} style={{ backgroundColor: accent }} className="text-white">
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

    </div>
  );
}
/* ── Expandable row wrapper ── */
function ExpandRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr className="border-b border-border">
      <td colSpan={colSpan} className="p-0">{children}</td>
    </tr>
  );
}

export function RecordsEditor() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [types, setTypes] = useState<RT[]>([]);
  const [valueSets, setValueSets] = useState<VS[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"types" | "fields" | "picklists" | "layouts">("types");
  const [subTab, setSubTab] = useState<string>("configuration");

  // Types state
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [parentFilter, setParentFilter] = useState(() => searchParams.get("parent") || "");
  const [editingType, setEditingType] = useState<Record<string, Partial<RT>>>({});
  const [typeFields, setTypeFields] = useState<Record<string, FD[]>>({});

  // Fields state
  const [allFields, setAllFields] = useState<FD[]>([]);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<Record<string, Partial<FD>>>({});
  const [fieldDeletePending, setFieldDeletePending] = useState<null | {
    objectApiName: string;
    apiName: string;
    label: string;
    isSystem: boolean;
    mode: "retire" | "delete";
    references?: number;
  }>(null);
  const [typeDeletePending, setTypeDeletePending] = useState<null | {
    apiName: string;
    label: string;
    isSystem: boolean;
    mode: "retire" | "delete";
  }>(null);
  const [fieldFilter, setFieldFilter] = useState("");
  const [fieldTypeFilter, setFieldTypeFilter] = useState("");
  const [selectedTypeForFields, setSelectedTypeForFields] = useState<string>("");

  // Picklists state
  const [showVsForm, setShowVsForm] = useState(false);
  const [expandedVs, setExpandedVs] = useState<string | null>(null);
  const [vsItems, setVsItems] = useState<Record<string, VSI[]>>({});
  const [optText, setOptText] = useState<Record<string, string>>({});
  /** Pending picklist option delete — prompts for replacement when refs exist */
  const [deletePending, setDeletePending] = useState<null | {
    vsApiName: string;
    apiValue: string;
    label: string;
    referenceCount: number;
    remaining: { api_value: string; label: string }[];
    replacement: string;
  }>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rt = await api<{ data: RT[]; parents: Parent[] }>("/api/catalog/record-types?include_inactive=1");
      setTypes(rt.data);
      setParents(rt.parents || []);
      const vs = await api<{ data: VS[] }>("/api/catalog/value-sets");
      setValueSets(vs.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Load all fields for the Fields tab
  const loadAllFields = useCallback(async () => {
    setError(null);
    try {
      const allTypes = types;
      const all: FD[] = [];
      for (const t of allTypes) {
        try {
          const detail = await api<{ data: { fields: FD[] } }>("/api/catalog/record-types/" + t.api_name);
          const fields = (detail.data.fields || []).map((f) => ({ ...f, object_api_name: t.object_api_name }));
          all.push(...fields);
        } catch { /* skip types that error */ }
      }
      setAllFields(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fields");
    }
  }, [types]);

  useEffect(() => {
    if (section === "fields" && types.length > 0 && allFields.length === 0) {
      void loadAllFields();
    }
  }, [section, types, allFields.length, loadAllFields]);

  // Load picklist items for a value set
  const loadVsItems = async (apiName: string) => {
    try {
      const detail = await api<{ data: VS & { items: VSI[] } }>("/api/catalog/value-sets/" + apiName);
      setVsItems((prev) => ({ ...prev, [apiName]: detail.data.items || [] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load options");
    }
  };
  const loadTypeFields = async (apiName: string) => {
    try {
      const detail = await api<{ data: { fields: FD[] } }>("/api/catalog/record-types/" + apiName);
      setTypeFields((prev) => ({ ...prev, [apiName]: detail.data.fields || [] }));
    } catch { /* skip */ }
  };

  // ── Types handlers ──
  const createType = async (vals: Record<string, string>) => {
    setBusy(true); setError(null); setStatus(null);
    const [pKind, pApi] = (vals.parent || parentFilter || "faculty:public").split(":");
    try {
      await api("/api/catalog/record-types", {
        method: "POST",
        body: JSON.stringify({
          api_name: vals.api_name,
          label: vals.label,
          description: vals.description || "",
          parent_kind: pKind,
          parent_api_name: pApi,
          structure: vals.structure || "list",
          show_as_tab: true,
        }),
      });
      setStatus("Created " + vals.api_name);
      setShowTypeForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const updateType = async (apiName: string, patch: Partial<RT>) => {
    setBusy(true); setError(null); setStatus(null);
    try {
      await api("/api/catalog/record-types/" + apiName, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setStatus("Updated " + apiName);
      setExpandedType(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Fields handlers ──
  const createField = async (vals: Record<string, string>) => {
    setBusy(true); setError(null); setStatus(null);
    try {
      const object_api_name = vals.object_api_name || selectedTypeForFields || types.find((t) => t.api_name === vals.type)?.object_api_name || vals.type;
      if (!object_api_name) { setError("Select a type first"); setBusy(false); return; }
      await api("/api/catalog/fields", {
        method: "POST",
        body: JSON.stringify({
          object_api_name,
          api_name: vals.api_name,
          label: vals.label,
          data_type: vals.data_type || "text",
          value_set_api_name: vals.value_set_api_name || null,
          lookup_object_api_name: vals.lookup_object_api_name || null,
          zone_role: vals.zone_role || null,
          show_in_column: vals.show_in_column === "true" || vals.show_in_column === "on",
        }),
      });
      setStatus("Added field " + vals.api_name);
      setShowFieldForm(false);
      setAllFields([]);
      void loadAllFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Field failed");
    } finally {
      setBusy(false);
    }
  };

  const updateField = async (objectApiName: string, apiName: string, patch: Partial<FD>) => {
    setBusy(true); setError(null); setStatus(null);
    try {
      await api("/api/catalog/fields/" + encodeURIComponent(objectApiName) + "/" + encodeURIComponent(apiName), {
        method: "PATCH",
        body: JSON.stringify({
          label: patch.label,
          is_required: patch.is_required,
          value_set_api_name: patch.value_set_api_name ?? null,
          lookup_object_api_name: patch.lookup_object_api_name ?? null,
          active: patch.active,
          zone_role: patch.zone_role ?? null,
          show_in_column: patch.show_in_column,
        }),
      });
      setStatus("Updated field " + apiName);
      setExpandedField(null);
      setEditingField((s) => {
        const n = { ...s };
        delete n[objectApiName + ":" + apiName];
        return n;
      });
      setAllFields([]);
      void loadAllFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Field update failed");
    } finally {
      setBusy(false);
    }
  };

  const requestFieldLifecycle = async (
    objectApiName: string,
    apiName: string,
    label: string,
    isSystem: boolean,
    mode: "retire" | "delete",
  ) => {
    setFieldDeletePending({ objectApiName, apiName, label, isSystem, mode });
  };

  const confirmFieldLifecycle = async () => {
    if (!fieldDeletePending) return;
    const { objectApiName, apiName, mode, isSystem } = fieldDeletePending;
    if (mode === "delete" && isSystem) {
      setError("System/reference fields cannot be hard-deleted. Retire them instead.");
      setFieldDeletePending(null);
      return;
    }
    setBusy(true); setError(null); setStatus(null);
    try {
      const res = await fetch(
        "/api/catalog/fields/" + encodeURIComponent(objectApiName) + "/" + encodeURIComponent(apiName),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hard_delete: mode === "delete" }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || res.statusText);
      setStatus(mode === "delete" ? ("Deleted field " + apiName) : ("Retired field " + apiName));
      setFieldDeletePending(null);
      setExpandedField(null);
      setAllFields([]);
      void loadAllFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Field lifecycle failed");
    } finally {
      setBusy(false);
    }
  };

  const requestTypeLifecycle = (t: RT, mode: "retire" | "delete") => {
    if (t.is_system) {
      setError(
        mode === "delete"
          ? "System record types cannot be deleted."
          : "System record types cannot be retired from this control. Deactivate via Active checkbox if allowed.",
      );
      return;
    }
    setTypeDeletePending({ apiName: t.api_name, label: t.label, isSystem: !!t.is_system, mode });
  };

  const confirmTypeLifecycle = async () => {
    if (!typeDeletePending) return;
    const { apiName, mode } = typeDeletePending;
    setBusy(true); setError(null); setStatus(null);
    try {
      if (mode === "delete") {
        const res = await fetch("/api/catalog/record-types/" + encodeURIComponent(apiName), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hard_delete: true }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || res.statusText);
        const c = json?.meta?.cascade;
        const detail = c
          ? " (fields " + (c.fields_removed ?? 0) + ", layouts " + (c.layouts_removed ?? 0) + ", instances " + (c.instances_removed ?? 0) + ")"
          : "";
        setStatus("Deleted record type " + apiName + detail);
      } else {
        await api("/api/catalog/record-types/" + encodeURIComponent(apiName), {
          method: "PATCH",
          body: JSON.stringify({ active: false, show_as_tab: false }),
        });
        setStatus("Retired record type " + apiName);
      }
      setTypeDeletePending(null);
      setExpandedType(null);
      setAllFields([]);
      void loadAllFields();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Type lifecycle failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Picklists handlers ──
  const createValueSet = async (vals: Record<string, string>) => {
    setBusy(true); setError(null); setStatus(null);
    try {
      const items = (vals.options || "").split("\n").map((l) => l.trim()).filter(Boolean).map((line) => ({ api_value: line, label: line }));
      await api("/api/catalog/value-sets", {
        method: "POST",
        body: JSON.stringify({ api_name: vals.api_name, label: vals.label, items }),
      });
      setStatus("Created picklist " + vals.api_name);
      setShowVsForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "VS failed");
    } finally {
      setBusy(false);
    }
  };

  const addOptions = async (vsApiName: string) => {
    const text = optText[vsApiName] || "";
    if (!text.trim()) return;
    setBusy(true); setError(null); setStatus(null);
    try {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        await api("/api/catalog/value-sets/" + vsApiName, {
          method: "POST",
          body: JSON.stringify({ api_value: line, label: line }),
        });
      }
      setStatus("Added " + lines.length + " option(s) to " + vsApiName);
      setOptText((s) => ({ ...s, [vsApiName]: "" }));
      await loadVsItems(vsApiName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opt failed");
    } finally {
      setBusy(false);
    }
  };

  const requestDeleteOption = async (vsApiName: string, item: VSI) => {
    setBusy(true); setError(null); setStatus(null);
    try {
      const res = await fetch("/api/catalog/value-sets/" + vsApiName, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ api_value: item.api_value }),
      });
      const json = await res.json();
      if (res.status === 409 || json?.error?.code === "REPLACEMENT_REQUIRED") {
        const remaining = (json?.error?.remaining_options || []).filter(
          (o: { api_value: string }) => o.api_value !== item.api_value,
        );
        setDeletePending({
          vsApiName,
          apiValue: item.api_value,
          label: item.label,
          referenceCount: json?.error?.reference_count || 0,
          remaining,
          replacement: remaining[0]?.api_value || "",
        });
        return;
      }
      if (!res.ok) throw new Error(json?.error?.message || res.statusText);
      setStatus("Deleted option " + item.api_value);
      setDeletePending(null);
      await loadVsItems(vsApiName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteOption = async () => {
    if (!deletePending) return;
    const { vsApiName, apiValue, replacement } = deletePending;
    if (!replacement) {
      setError("Select a replacement value for existing references.");
      return;
    }
    setBusy(true); setError(null); setStatus(null);
    try {
      const res = await fetch("/api/catalog/value-sets/" + vsApiName, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ api_value: apiValue, replacement_api_value: replacement }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || res.statusText);
      const n = json?.meta?.remapped ?? 0;
      setStatus("Deleted " + apiValue + (n ? " (remapped " + n + " reference" + (n === 1 ? "" : "s") + ")" : ""));
      setDeletePending(null);
      await loadVsItems(vsApiName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };


  // ── Derived data ──
  const filteredTypes = useMemo(() => {
    let rows = [...types];
    if (parentFilter) {
      const [pk, pa] = parentFilter.split(":");
      rows = rows.filter((t) => t.parent_kind === pk && t.parent_api_name === pa);
    }
    return rows;
  }, [types, parentFilter]);

  const filteredFields = useMemo(() => {
    let rows = [...allFields];
    if (selectedTypeForFields) {
      const targetObj = types.find((t) => t.api_name === selectedTypeForFields)?.object_api_name || selectedTypeForFields;
      rows = rows.filter((f) => f.object_api_name === targetObj);
    }
    if (fieldTypeFilter) rows = rows.filter((f) => f.data_type === fieldTypeFilter);
    if (fieldFilter) {
      const ff = fieldFilter.toLowerCase();
      rows = rows.filter((f) => f.api_name.toLowerCase().includes(ff) || f.label.toLowerCase().includes(ff) || (f.object_api_name || "").toLowerCase().includes(ff));
    }
    return rows;
  }, [allFields, selectedTypeForFields, types, fieldTypeFilter, fieldFilter]);

  const parentOptions = useMemo<SelectOption[]>(() => parents.map((p) => ({
    value: p.parent_kind + ":" + p.parent_api_name,
    label: p.label,
    group: p.group,
  })), [parents]);

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {status && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">{status}</div>}

      <SectionTabs
        ariaLabel="Records Editor sections"
        value={section}
        onChange={(id) => { setSection(id as "types" | "fields" | "picklists" | "layouts"); setSubTab("configuration"); }}
        accent={theme.colors.brand}
        noSticky
        items={[
          { id: "types", label: "Types" },
          { id: "fields", label: "Fields" },
          { id: "picklists", label: "Picklists" },
          { id: "layouts", label: "Layouts" },
        ]}
      />

      {/* ── TYPES ── */}
      {section === "types" && (
        <div role="tabpanel" className="space-y-3">
          <SubTabBar
            items={[{ id: "configuration", label: "Configuration" }]}
            activeId={subTab}
            accent={theme.colors.brand}
            onSelect={setSubTab}
            ariaLabel="Types sub-sections"
          />
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mt-1 text-sm text-muted-foreground">Named tabs under parent entities. System types are relabelable.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="shrink-0 border-0 text-white" style={{ backgroundColor: theme.colors.brand }}>Types</Badge>
                  <select
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    value={parentFilter}
                    onChange={(e) => setParentFilter(e.target.value)}
                  >
                    <option value="">All parents</option>
                    {parents.map((p) => (
                      <option key={p.parent_kind + ":" + p.parent_api_name} value={p.parent_kind + ":" + p.parent_api_name}>{p.group ? p.group + " — " : ""}{p.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowTypeForm((s) => !s)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                    style={{ backgroundColor: theme.colors.brand }}
                  >
                    {showTypeForm ? "Close" : "New Record Type"}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {showTypeForm && (
                <CreateForm
                  fields={[
                    { key: "api_name", label: "API name", placeholder: "api_name" },
                    { key: "label", label: "Label", placeholder: "Name" },
                    { key: "description", label: "Description", placeholder: "Description" },
                    { key: "parent", label: "Parent", type: "custom-parent", options: parentOptions },
                    { key: "structure", label: "Structure", type: "select", options: [{ value: "list", label: "Lines" }, { value: "header", label: "Header" }, { value: "header_lines", label: "Header and lines" }] },
                  ]}
                  accent={theme.colors.brand}
                  onSubmit={createType}
                  onCancel={() => setShowTypeForm(false)}
                  busy={busy}
                  submitLabel="Create type"
                  initialValues={parentFilter ? { parent: parentFilter } : undefined}
                />
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Label</th>
                      <th className="px-4 py-2.5 font-medium">Kind</th>
                      <th className="px-4 py-2.5 font-medium">API name</th>
                      <th className="px-4 py-2.5 font-medium">Parent</th>
                      <th className="px-4 py-2.5 font-medium">Structure</th>
                      <th className="px-4 py-2.5 font-medium">System?</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTypes.map((t) => {
                      const isExpanded = expandedType === t.api_name;
                      const parentLabel = parents.find((p) => p.parent_kind === t.parent_kind && p.parent_api_name === t.parent_api_name)?.label || t.parent_kind + ":" + t.parent_api_name;
                      const draft = editingType[t.api_name] ?? {};
                      return (
                        <Fragment key={t.api_name}>
                          <tr className="border-b border-border/70 transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 align-top font-medium">{formatSampleLabel(t.label, !!t.is_system)}<RecordIdDisplay id={t.id} /></td>
                            <td className="px-4 py-3 align-top"><StandardBadge isSystem={!!t.is_system} /></td>
                            <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{t.api_name}</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{parentLabel}</td>
                            <td className="px-4 py-3 align-top"><Badge variant="outline" className="text-[10px]">{structureLabel(t.structure)}</Badge></td>
                            <td className="px-4 py-3 align-top">{t.is_system ? <span className="text-xs font-medium text-amber-600">System</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                            <td className="px-4 py-3 text-right align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedType(null);
                                  } else {
                                    setExpandedType(t.api_name);
                                    setEditingType((s) => ({
                                      ...s,
                                      [t.api_name]: {
                                        label: t.label,
                                        description: t.description,
                                        structure: t.structure,
                                        sort_order: t.sort_order ?? 0,
                                        show_as_tab: t.show_as_tab ?? true,
                                        active: t.active ?? true,
                                      },
                                    }));
                                    void loadTypeFields(t.api_name);
                                  }
                                }}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                style={isExpanded ? { borderColor: theme.colors.brand, color: theme.colors.brand } : undefined}
                              >
                                {isExpanded ? "Close" : "Edit"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <ExpandRow colSpan={6}>
                              <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6" style={{ boxShadow: `inset 3px 0 0 ${theme.colors.brand}` }}>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Label</label>
                                    <input
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      value={draft.label ?? t.label}
                                      onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], label: e.target.value } }))}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Structure</label>
                                    <select
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      value={draft.structure ?? t.structure}
                                      onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], structure: e.target.value } }))}
                                    >
                                      <option value="list">Lines</option>
                                      <option value="header">Header</option>
                                      <option value="header_lines">Header and lines</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
                                    <input
                                      type="number"
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      value={draft.sort_order ?? t.sort_order ?? 0}
                                      onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], sort_order: parseInt(e.target.value || "0", 10) } }))}
                                    />
                                  </div>
                                  <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                                    <textarea
                                      className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      value={draft.description ?? t.description ?? ""}
                                      onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], description: e.target.value } }))}
                                    />
                                  </div>
                                  <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={draft.show_as_tab ?? t.show_as_tab ?? true}
                                        onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], show_as_tab: e.target.checked } }))}
                                      />
                                      <span className="text-sm font-medium">Show as tab</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={draft.active ?? t.active ?? true}
                                        onChange={(e) => setEditingType((s) => ({ ...s, [t.api_name]: { ...s[t.api_name], active: e.target.checked } }))}
                                      />
                                      <span className="text-sm font-medium">Active</span>
                                    </label>
                                  </div>
                                  <div className="space-y-1 text-sm sm:col-span-2 lg:col-span-3">
                                    <p><span className="text-muted-foreground">API name:</span> <span className="font-mono text-xs">{t.api_name}</span></p>
                                    <p><span className="text-muted-foreground">Object:</span> <span className="font-mono text-xs">{t.object_api_name}</span></p>
                                    <p><span className="text-muted-foreground">Parent:</span> {parentLabel}</p>
                                  </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <Button
                                    disabled={busy}
                                    onClick={() => void updateType(t.api_name, {
                                      label: draft.label ?? t.label,
                                      description: draft.description ?? t.description,
                                      structure: draft.structure ?? t.structure,
                                      sort_order: draft.sort_order ?? t.sort_order ?? 0,
                                      show_as_tab: draft.show_as_tab ?? t.show_as_tab ?? true,
                                      active: draft.active ?? t.active ?? true,
                                    })}
                                    style={{ backgroundColor: theme.colors.brand }}
                                    className="text-white"
                                  >
                                    Save changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setExpandedType(null);
                                      setEditingType((s) => {
                                        const n = { ...s };
                                        delete n[t.api_name];
                                        return n;
                                      });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  {!t.is_system && (t.active !== false) && (
                                    <Button
                                      variant="outline"
                                      disabled={busy}
                                      className="border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                                      onClick={() => requestTypeLifecycle(t, "retire")}
                                    >
                                      Retire type
                                    </Button>
                                  )}
                                  {!t.is_system && (
                                    <Button
                                      variant="outline"
                                      disabled={busy}
                                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                      onClick={() => requestTypeLifecycle(t, "delete")}
                                    >
                                      Delete type
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => { setSection("fields"); setSelectedTypeForFields(t.api_name); }}
                                  >
                                    Manage Fields
                                  </Button>
                                </div>
                                {typeDeletePending && typeDeletePending.apiName === t.api_name && (
                                  <div className={"mt-4 rounded-md border p-3 text-sm " + (typeDeletePending.mode === "delete" ? "border-destructive/40 bg-destructive/10" : "border-amber-500/40 bg-amber-500/10")}>
                                    <p className="font-medium">
                                      {typeDeletePending.mode === "delete" ? "Delete" : "Retire"} record type “{typeDeletePending.label}”?
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      {typeDeletePending.mode === "delete"
                                        ? "Permanently removes this type and cascades: its custom fields, saved layouts, catalog object registration, and any session/fixture instance rows for this type. This cannot be undone. System types stay protected."
                                        : "Sets the type inactive and hides its zone tab. You can keep Retire for soft deactivation; use Delete type for hard removal. System types stay protected."}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button
                                        disabled={busy}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() => void confirmTypeLifecycle()}
                                      >
                                        {typeDeletePending.mode === "delete" ? "Confirm delete" : "Confirm retire"}
                                      </Button>
                                      <Button variant="outline" onClick={() => setTypeDeletePending(null)}>Cancel</Button>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-6 border-t border-border pt-4">
                                  <div className="mb-2">
                                    <p className="text-sm font-medium">Fields Preview</p>
                                  </div>
                                  {typeFields[t.api_name]?.length ? (
                                    <div className="flex flex-wrap gap-2">
                                      {typeFields[t.api_name]?.map((f) => (
                                        <Badge key={f.api_name} variant="secondary" className="text-[10px] font-normal">
                                          {f.label} <span className="ml-1 font-mono text-muted-foreground">{f.data_type}</span>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs italic text-muted-foreground">No fields defined for this type yet.</p>
                                  )}
                                </div>
                                {t.is_system && (
                                  <p className="mt-2 text-xs italic text-muted-foreground">System type — API name and parent are read-only.</p>
                                )}
                              </div>
                            </ExpandRow>
                          )}
                        </Fragment>
                      );
                    })}
                    {filteredTypes.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No record types yet. Use New Record Type to add the first one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── FIELDS ── */}
      {section === "fields" && (
        <div role="tabpanel" className="space-y-3">
          <SubTabBar
            items={[{ id: "configuration", label: "Configuration" }]}
            activeId={subTab}
            accent={theme.colors.brand}
            onSelect={setSubTab}
            ariaLabel="Fields sub-sections"
          />
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mt-1 text-sm text-muted-foreground">Field definitions across all record types. Filter by type or search.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="shrink-0 border-0 text-white" style={{ backgroundColor: theme.colors.brand }}>Fields</Badge>
                  <select
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    value={selectedTypeForFields}
                    onChange={(e) => setSelectedTypeForFields(e.target.value)}
                  >
                    <option value="">All record types</option>
                    {types.map((t) => <option key={t.api_name} value={t.api_name}>{t.label}</option>)}
                  </select>
                  <select
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    value={fieldTypeFilter}
                    onChange={(e) => setFieldTypeFilter(e.target.value)}
                  >
                    <option value="">All data types</option>
                    {DATA_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                  <input
                    className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search…"
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFieldForm((s) => !s)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                    style={{ backgroundColor: theme.colors.brand }}
                  >
                    {showFieldForm ? "Close" : "New Field"}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {showFieldForm && (
                <CreateForm
                  fields={[
                    { key: "api_name", label: "API name", placeholder: "field_api" },
                    { key: "label", label: "Label", placeholder: "Label" },
                    { key: "type", label: "Record type", type: "select", options: types.map((t) => t.api_name) },
                    { key: "data_type", label: "Data type", type: "select", options: DATA_TYPES },
                    ...(selectedTypeForFields && types.find((t) => t.api_name === selectedTypeForFields)?.structure === "header_lines"
                      ? [
                          { key: "zone_role", label: "Placement", type: "select" as const, options: [{ value: "header", label: "Header" }, { value: "list", label: "Lines" }] },
                          { key: "show_in_column", label: "Show as column in lines table", type: "checkbox" as const, showWhen: (vals: Record<string, string>) => vals.zone_role === "list" },
                        ]
                      : []),
                    { key: "value_set_api_name", label: "Value set (picklist)", type: "select", options: valueSets.map((v) => v.api_name) },
                    { key: "lookup_object_api_name", label: "Lookup object", type: "select", options: types.map((t) => t.object_api_name) },
                  ]}
                  accent={theme.colors.brand}
                  onSubmit={createField}
                  onCancel={() => setShowFieldForm(false)}
                  busy={busy}
                  submitLabel="Add field"
                  initialValues={selectedTypeForFields ? { type: selectedTypeForFields } : undefined}
                />
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Label</th>
                      <th className="px-4 py-2.5 font-medium">Kind</th>
                      <th className="px-4 py-2.5 font-medium">API name</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Object</th>
                      <th className="px-4 py-2.5 font-medium">Placement</th>
                      <th className="px-4 py-2.5 font-medium">Value set / Lookup</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map((f) => {
                      const fid = (f.object_api_name || "") + ":" + f.api_name;
                      const isExpanded = expandedField === fid;
                      const draft = editingField[fid] ?? {};
                      const objectApi = f.object_api_name || "";
                      return (
                        <Fragment key={fid}>
                          <tr className="border-b border-border/70 transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 align-top font-medium">{formatSampleLabel(f.label, !!f.is_system)}<RecordIdDisplay id={f.id} />{f.active === false ? <Badge className="ml-2 border-0 bg-muted text-muted-foreground text-[10px]">Retired</Badge> : null}</td>
                            <td className="px-4 py-3 align-top"><StandardBadge isSystem={!!f.is_system} /></td>
                            <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{f.api_name}</td>
                            <td className="px-4 py-3 align-top"><Badge variant="outline" className="text-[10px]">{f.data_type}</Badge></td>
                            <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{f.object_api_name || "—"}</td>
                            <td className="px-4 py-3 align-top">{placementCell(f)}</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{f.value_set_api_name || f.lookup_object_api_name || "—"}</td>
                            <td className="px-4 py-3 text-right align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedField(null);
                                  } else {
                                    setExpandedField(fid);
                                    setEditingField((s) => ({
                                      ...s,
                                      [fid]: {
                                        label: f.label,
                                        value_set_api_name: f.value_set_api_name,
                                        lookup_object_api_name: f.lookup_object_api_name ?? null,
                                        is_required: f.is_required,
                                        active: f.active !== false,
                                        zone_role: f.zone_role ?? null,
                                        show_in_column: f.show_in_column,
                                      },
                                    }));
                                  }
                                }}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                style={isExpanded ? { borderColor: theme.colors.brand, color: theme.colors.brand } : undefined}
                              >
                                {isExpanded ? "Close" : "Edit"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <ExpandRow colSpan={7}>
                              <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6" style={{ boxShadow: `inset 3px 0 0 ${theme.colors.brand}` }}>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Label</label>
                                    <input
                                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                      value={draft.label ?? f.label}
                                      onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], label: e.target.value } }))}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Value set</label>
                                    {f.data_type === "picklist" || f.data_type === "multipicklist" ? (
                                      <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={draft.value_set_api_name ?? f.value_set_api_name ?? ""}
                                        onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], value_set_api_name: e.target.value || null } }))}
                                      >
                                        <option value="">—</option>
                                        {valueSets.map((vs) => <option key={vs.api_name} value={vs.api_name}>{vs.label}</option>)}
                                      </select>
                                    ) : (
                                      <div className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                        <span className="truncate">{f.value_set_api_name || "Not available"}</span>
                                        <span className="shrink-0 text-[10px] italic">Only for picklist/multipicklist</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">Lookup object</label>
                                    {f.data_type === "lookup" ? (
                                      <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={draft.lookup_object_api_name ?? f.lookup_object_api_name ?? ""}
                                        onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], lookup_object_api_name: e.target.value || null } }))}
                                      >
                                        <option value="">—</option>
                                        {types.map((t) => <option key={t.object_api_name} value={t.object_api_name}>{t.object_api_name}</option>)}
                                      </select>
                                    ) : (
                                      <div className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                                        <span className="truncate">{f.lookup_object_api_name || "Not available"}</span>
                                        <span className="shrink-0 text-[10px] italic">Only for lookup fields</span>
                                      </div>
                                    )}
                                  </div>
                                  <label className="flex items-center gap-2 pt-6">
                                    <input
                                      type="checkbox"
                                      checked={draft.is_required ?? f.is_required ?? false}
                                      onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], is_required: e.target.checked } }))}
                                    />
                                    <span className="text-sm font-medium">Required</span>
                                  </label>
                                  {(() => {
                                    const rt = types.find((t) => t.object_api_name === objectApi);
                                    if (!rt || rt.structure !== "header_lines") return null;
                                    const role = draft.zone_role ?? f.zone_role ?? "header";
                                    return (
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground">Placement (Header and lines)</label>
                                        <select
                                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                          value={role ?? ""}
                                          onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], zone_role: (e.target.value || null) as "header" | "list" | null } }))}
                                        >
                                          <option value="header">Header</option>
                                          <option value="list">Lines</option>
                                        </select>
                                        <p className="text-[10px] italic text-muted-foreground">Header fields show on the header form; Lines fields show on the lines table.</p>
                                        {role === "list" && (
                                          <label className="flex items-center gap-2 pt-1">
                                            <input
                                              type="checkbox"
                                              checked={draft.show_in_column ?? f.show_in_column ?? false}
                                              onChange={(e) => setEditingField((s) => ({ ...s, [fid]: { ...s[fid], show_in_column: e.target.checked } }))}
                                            />
                                            <span className="text-sm font-medium">Show as column in lines table</span>
                                          </label>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  <div className="space-y-1 text-sm sm:col-span-2 lg:col-span-3">
                                    <p><span className="text-muted-foreground">API name:</span> <span className="font-mono text-xs">{f.api_name}</span> (read-only)</p>
                                    <p><span className="text-muted-foreground">Data type:</span> {f.data_type} (read-only)</p>
                                    <p><span className="text-muted-foreground">Object:</span> <span className="font-mono text-xs">{objectApi || "—"}</span></p>
                                    {f.is_system && (
                                      <p className="text-xs italic text-muted-foreground">System field — hard delete is blocked; retire is allowed to hide from new layouts.</p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Button
                                    disabled={busy || !objectApi}
                                    onClick={() => void updateField(objectApi, f.api_name, {
                                      label: draft.label ?? f.label,
                                      value_set_api_name: draft.value_set_api_name ?? f.value_set_api_name,
                                      lookup_object_api_name: draft.lookup_object_api_name ?? f.lookup_object_api_name,
                                      is_required: draft.is_required ?? f.is_required,
                                      active: draft.active ?? f.active,
                                      zone_role: draft.zone_role ?? f.zone_role ?? null,
                                      show_in_column: draft.show_in_column ?? f.show_in_column ?? false,
                                    })}
                                    style={{ backgroundColor: theme.colors.brand }}
                                    className="text-white"
                                  >
                                    Save changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setExpandedField(null);
                                      setEditingField((s) => {
                                        const n = { ...s };
                                        delete n[fid];
                                        return n;
                                      });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="outline"
                                    disabled={busy || !objectApi || f.active === false}
                                    onClick={() => void requestFieldLifecycle(objectApi, f.api_name, f.label, !!f.is_system, "retire")}
                                  >
                                    Retire
                                  </Button>
                                  {!f.is_system && (
                                    <Button
                                      variant="outline"
                                      disabled={busy || !objectApi}
                                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                      onClick={() => void requestFieldLifecycle(objectApi, f.api_name, f.label, !!f.is_system, "delete")}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                                {fieldDeletePending && fieldDeletePending.objectApiName === objectApi && fieldDeletePending.apiName === f.api_name && (
                                  <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                                    <p className="font-medium">
                                      {fieldDeletePending.mode === "delete" ? "Hard-delete" : "Retire"} field “{fieldDeletePending.label}”?
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      {fieldDeletePending.mode === "delete"
                                        ? "Hard delete removes the definition when unreferenced. Referenced custom fields must be retired instead."
                                        : "Retire hides the field from active catalogs while preserving historical references."}
                                      {fieldDeletePending.isSystem ? " System fields cannot be hard-deleted." : ""}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <Button
                                        disabled={busy}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() => void confirmFieldLifecycle()}
                                      >
                                        Confirm {fieldDeletePending.mode === "delete" ? "delete" : "retire"}
                                      </Button>
                                      <Button variant="outline" onClick={() => setFieldDeletePending(null)}>Cancel</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ExpandRow>
                          )}
                        </Fragment>
                      );
                    })}
                    {filteredFields.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No fields found. Use New Field to add one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── PICKLISTS ── */}
      {section === "picklists" && (
        <div role="tabpanel" className="space-y-3">
          <SubTabBar
            items={[{ id: "configuration", label: "Configuration" }]}
            activeId={subTab}
            accent={theme.colors.brand}
            onSelect={setSubTab}
            ariaLabel="Picklists sub-sections"
          />
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mt-1 text-sm text-muted-foreground">Value sets for picklist fields. Expand a row to view, add, or delete options (delete prompts for replacement when referenced).</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="shrink-0 border-0 text-white" style={{ backgroundColor: theme.colors.brand }}>Picklists</Badge>
                  <button
                    type="button"
                    onClick={() => setShowVsForm((s) => !s)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
                    style={{ backgroundColor: theme.colors.brand }}
                  >
                    {showVsForm ? "Close" : "New Picklist"}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {showVsForm && (
                <CreateForm
                  fields={[
                    { key: "api_name", label: "API name", placeholder: "value_set api_name" },
                    { key: "label", label: "Label", placeholder: "Label" },
                    { key: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2\nOption 3" },
                  ]}
                  accent={theme.colors.brand}
                  onSubmit={createValueSet}
                  onCancel={() => setShowVsForm(false)}
                  busy={busy}
                  submitLabel="Create picklist"
                />
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Label</th>
                      <th className="px-4 py-2.5 font-medium">Kind</th>
                      <th className="px-4 py-2.5 font-medium">API name</th>
                      <th className="px-4 py-2.5 font-medium">Options</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueSets.map((vs) => {
                      const isExpanded = expandedVs === vs.api_name;
                      const items = vsItems[vs.api_name] || [];
                      return (
                        <Fragment key={vs.api_name}>
                          <tr className="border-b border-border/70 transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 align-top font-medium">{formatSampleLabel(vs.label, !!vs.is_system)}<RecordIdDisplay id={vs.id} /></td>
                            <td className="px-4 py-3 align-top"><StandardBadge isSystem={!!vs.is_system} /></td>
                            <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">{vs.api_name}</td>
                            <td className="px-4 py-3 align-top text-muted-foreground">{items.length > 0 ? items.length + " option" + (items.length !== 1 ? "s" : "") : "—"}</td>
                            <td className="px-4 py-3 text-right align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedVs(null);
                                  } else {
                                    setExpandedVs(vs.api_name);
                                    void loadVsItems(vs.api_name);
                                  }
                                }}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                                style={isExpanded ? { borderColor: theme.colors.brand, color: theme.colors.brand } : undefined}
                              >
                                {isExpanded ? "Close" : "Expand"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <ExpandRow colSpan={4}>
                              <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6" style={{ boxShadow: `inset 3px 0 0 ${theme.colors.brand}` }}>
                                <div className="mb-3">
                                  <p className="mb-2 text-sm font-medium">Existing options</p>
                                  {items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No options yet. Add some below.</p>
                                  ) : (
                                    <>
                                    <div className="flex flex-wrap gap-2">
                                      {items.map((item) => (
                                        <span
                                          key={item.id}
                                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                                        >
                                          <span>{formatSampleLabel(item.label, false)}</span>
                                          <span className="font-mono text-[10px] text-muted-foreground">{item.api_value}</span>
                                          <button
                                            type="button"
                                            title="Delete option"
                                            disabled={busy}
                                            onClick={() => void requestDeleteOption(vs.api_name, item)}
                                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            aria-label={"Delete option " + item.api_value}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    {deletePending && deletePending.vsApiName === vs.api_name && (
                                      <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm">
                                        <p className="font-medium">
                                          <>Replace references to &ldquo;{deletePending.label}&rdquo; ({deletePending.apiValue})</>
                                        </p>
                                        <p className="mt-1 text-muted-foreground">
                                          {deletePending.referenceCount > 0
                                            ? deletePending.referenceCount + " existing reference" + (deletePending.referenceCount === 1 ? "" : "s") + " must move to another option before delete."
                                            : "Choose a replacement option, then confirm delete."}
                                        </p>
                                        {deletePending.remaining.length === 0 ? (
                                          <p className="mt-2 text-destructive">No remaining options available for replacement. Add another option first.</p>
                                        ) : (
                                          <div className="mt-3 flex flex-wrap items-end gap-2">
                                            <label className="flex flex-col gap-1">
                                              <span className="text-xs font-medium text-muted-foreground">Replacement value</span>
                                              <select
                                                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                                value={deletePending.replacement}
                                                onChange={(e) =>
                                                  setDeletePending((s) =>
                                                    s ? { ...s, replacement: e.target.value } : s,
                                                  )
                                                }
                                              >
                                                {deletePending.remaining.map((o) => (
                                                  <option key={o.api_value} value={o.api_value}>
                                                    {o.label} ({o.api_value})
                                                  </option>
                                                ))}
                                              </select>
                                            </label>
                                            <Button
                                              disabled={busy || !deletePending.replacement}
                                              onClick={() => void confirmDeleteOption()}
                                              style={{ backgroundColor: theme.colors.brand }}
                                              className="text-white"
                                            >
                                              Delete & remap
                                            </Button>
                                            <Button variant="outline" onClick={() => setDeletePending(null)}>
                                              Cancel
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    </>
                                  )}
                                </div>
                                <div className="mt-4">
                                  <label className="mb-1 block text-sm font-medium">Add options (one per line)</label>
                                  <textarea
                                    className="min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder={"New option 1\nNew option 2"}
                                    value={optText[vs.api_name] || ""}
                                    onChange={(e) => setOptText((s) => ({ ...s, [vs.api_name]: e.target.value }))}
                                  />
                                  <Button
                                    disabled={busy || !(optText[vs.api_name] || "").trim()}
                                    onClick={() => void addOptions(vs.api_name)}
                                    style={{ backgroundColor: theme.colors.brand }}
                                    className="mt-2 text-white"
                                  >
                                    Add options
                                  </Button>
                                </div>
                              </div>
                            </ExpandRow>
                          )}
                        </Fragment>
                      );
                    })}
                    {valueSets.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No picklists yet. Use New Picklist to add the first one.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LAYOUTS ── */}
      {section === "layouts" && (
        <div role="tabpanel" className="space-y-3">
          <SubTabBar
            items={[{ id: "configuration", label: "Configuration" }]}
            activeId={subTab}
            accent={theme.colors.brand}
            onSelect={setSubTab}
            ariaLabel="Layouts sub-sections"
          />
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mt-1 text-sm text-muted-foreground">Visual form layout builder. Configure sections, field order, and visibility for record forms.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="shrink-0 border-0 text-white" style={{ backgroundColor: theme.colors.brand }}>Layouts</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LayoutEditorWrapper />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
