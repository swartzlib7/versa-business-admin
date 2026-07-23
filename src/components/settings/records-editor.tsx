"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SectionTabs } from "@/components/ui/section-tabs";
import { theme } from "@/lib/theme";

type Parent = { parent_kind: string; parent_api_name: string; label: string; baked_in_tabs: string[] };
type RT = { api_name: string; label: string; parent_kind: string; parent_api_name: string; structure: string; object_api_name: string };
type FD = { api_name: string; label: string; data_type: string; value_set_api_name: string | null };
type VS = { api_name: string; label: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, credentials: "include" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || res.statusText);
  return json as T;
}

export function RecordsEditor() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [types, setTypes] = useState<RT[]>([]);
  const [valueSets, setValueSets] = useState<VS[]>([]);
  const [selectedParent, setSelectedParent] = useState("faculty:public");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fields, setFields] = useState<FD[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newType, setNewType] = useState({ api_name: "", label: "", structure: "list" });
  const [newField, setNewField] = useState({ api_name: "", label: "", data_type: "text", value_set_api_name: "" });
  const [newVs, setNewVs] = useState({ api_name: "", label: "", option: "" });
  const [addOpt, setAddOpt] = useState({ vs: "", api_value: "", label: "" });
  const [section, setSection] = useState<"types" | "fields" | "picklists">("types");
  const [pKind, pApi] = selectedParent.split(":");
  const load = useCallback(async () => {
    setError(null);
    try {
      const rt = await api<{ data: RT[]; parents: Parent[] }>("/api/catalog/record-types?include_inactive=1");
      setTypes(rt.data); setParents(rt.parents || []);
      const vs = await api<{ data: VS[] }>("/api/catalog/value-sets");
      setValueSets(vs.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const typesForParent = useMemo(() => types.filter((t) => t.parent_kind === pKind && t.parent_api_name === pApi), [types, pKind, pApi]);
  const loadTypeDetail = async (apiName: string) => {
    setSelectedType(apiName); setError(null);
    try {
      const detail = await api<{ data: { fields: FD[] } }>("/api/catalog/record-types/" + apiName);
      setFields(detail.data.fields || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed type"); }
  };
  const createType = async () => {
    setBusy(true); setError(null); setStatus(null);
    try {
      await api("/api/catalog/record-types", { method: "POST", body: JSON.stringify({ api_name: newType.api_name, label: newType.label, parent_kind: pKind, parent_api_name: pApi, structure: newType.structure, show_as_tab: true }) });
      setStatus("Created " + newType.api_name);
      setNewType({ api_name: "", label: "", structure: "list" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Create failed"); }
    finally { setBusy(false); }
  };
  const extendField = async () => {
    if (!selectedType) return;
    setBusy(true); setError(null); setStatus(null);
    try {
      const object_api_name = types.find((t) => t.api_name === selectedType)?.object_api_name || selectedType;
      await api("/api/catalog/fields", { method: "POST", body: JSON.stringify({ object_api_name, api_name: newField.api_name, label: newField.label, data_type: newField.data_type, value_set_api_name: newField.value_set_api_name || null }) });
      setStatus("Added " + newField.api_name);
      setNewField({ api_name: "", label: "", data_type: "text", value_set_api_name: "" });
      await loadTypeDetail(selectedType);
    } catch (e) { setError(e instanceof Error ? e.message : "Field failed"); }
    finally { setBusy(false); }
  };
  const createValueSet = async () => {
    setBusy(true); setError(null); setStatus(null);
    try {
      const items = newVs.option ? [{ api_value: newVs.option, label: newVs.option }] : [];
      await api("/api/catalog/value-sets", { method: "POST", body: JSON.stringify({ api_name: newVs.api_name, label: newVs.label, items }) });
      setStatus("Created picklist " + newVs.api_name);
      setNewVs({ api_name: "", label: "", option: "" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "VS failed"); }
    finally { setBusy(false); }
  };
  const addOption = async () => {
    setBusy(true); setError(null); setStatus(null);
    try {
      await api("/api/catalog/value-sets/" + addOpt.vs, { method: "POST", body: JSON.stringify({ api_value: addOpt.api_value, label: addOpt.label || addOpt.api_value }) });
      setStatus("Added option to " + addOpt.vs);
      setAddOpt({ vs: addOpt.vs, api_value: "", label: "" });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Opt failed"); }
    finally { setBusy(false); }
  };
  const currentParent = parents.find((p) => p.parent_kind + ":" + p.parent_api_name === selectedParent);
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground max-w-3xl">
          Customize zone entities including baked-in tabs. Types become named tabs under the
          selected parent; fields and picklists extend those types.
        </p>
      </div>
      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      {status && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">{status}</div>}

      <SectionTabs
        ariaLabel="Records Editor sections"
        value={section}
        onChange={(id) => setSection(id as "types" | "fields" | "picklists")}
        accent={theme.colors.brand}
        items={[
          { id: "types", label: "Types", hint: "Parents and named record types" },
          { id: "fields", label: "Fields", hint: "Extend selected type fields" },
          { id: "picklists", label: "Picklists", hint: "Value sets and options" },
        ]}
      />

      {section === "types" && (
        <div role="tabpanel" className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parent entity</CardTitle>
              <CardDescription>Faculty, collab, environment, or baked-in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedParent} onChange={(e) => { setSelectedParent(e.target.value); setSelectedType(null); setFields([]); }}
              >
                {parents.map((p) => (
                  <option key={p.parent_kind + ":" + p.parent_api_name} value={p.parent_kind + ":" + p.parent_api_name}>{p.label}</option>
                ))}
              </select>
              {currentParent && currentParent.baked_in_tabs.length > 0 && (
                <p className="text-xs text-muted-foreground">Baked-in: {currentParent.baked_in_tabs.join(", ")}</p>
              )}
              <Separator />
              <ul className="space-y-1">
                {typesForParent.map((t) => (
                  <li key={t.api_name}>
                    <button type="button" className={"w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted " + (selectedType === t.api_name ? "bg-muted font-medium" : "")} onClick={() => void loadTypeDetail(t.api_name)}
                    >
                      {t.label} <Badge variant="outline" className="text-[10px]">{t.structure}</Badge>
                    </button>
                  </li>
                ))}
                {typesForParent.length === 0 && <li className="text-sm text-muted-foreground">No types yet. Create one to add a named tab under this parent.</li>}
              </ul>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Add record type</CardTitle>
              <CardDescription>Named tab under the selected parent. Nothing is pre-seeded for Public/Treasury placeholders.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="api_name" value={newType.api_name} onChange={(e) => setNewType((s) => ({ ...s, api_name: e.target.value }))} />
              <Input placeholder="Name" value={newType.label} onChange={(e) => setNewType((s) => ({ ...s, label: e.target.value }))} />
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={newType.structure} onChange={(e) => setNewType((s) => ({ ...s, structure: e.target.value }))}
              >
                <option value="list">list</option>
                <option value="header">header</option>
                <option value="header_lines">header_lines</option>
              </select>
              <Button disabled={busy} onClick={() => void createType()}>Create type</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {section === "fields" && (
        <div role="tabpanel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fields</CardTitle>
              <CardDescription>Select a type on the Types tab first, then extend its fields here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Type</label>
                <select className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[12rem]" value={selectedType || ""} onChange={(e) => { const v = e.target.value; if (v) void loadTypeDetail(v); else { setSelectedType(null); setFields([]); } }}
                >
                  <option value="">Select type…</option>
                  {types.map((t) => (
                    <option key={t.api_name} value={t.api_name}>{t.label} ({t.parent_api_name})</option>
                  ))}
                </select>
              </div>
              {!selectedType && <p className="text-sm text-muted-foreground">No type selected.</p>}
              {selectedType && (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left"><tr>
                        <th className="px-3 py-2">API</th><th className="px-3 py-2">Label</th>
                        <th className="px-3 py-2">Type</th><th className="px-3 py-2">Value set</th>
                      </tr></thead>
                      <tbody>
                        {fields.map((f) => (
                          <tr key={f.api_name} className="border-t">
                            <td className="px-3 py-1.5 font-mono text-xs">{f.api_name}</td>
                            <td className="px-3 py-1.5">{f.label}</td>
                            <td className="px-3 py-1.5">{f.data_type}</td>
                            <td className="px-3 py-1.5 text-muted-foreground">{f.value_set_api_name || "-"}</td>
                          </tr>
                        ))}
                        {fields.length === 0 && (
                          <tr><td className="px-3 py-2 text-muted-foreground" colSpan={4}>No fields yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Input placeholder="field_api" value={newField.api_name} onChange={(e) => setNewField((s) => ({ ...s, api_name: e.target.value }))} />
                    <Input placeholder="Label" value={newField.label} onChange={(e) => setNewField((s) => ({ ...s, label: e.target.value }))} />
                    <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={newField.data_type} onChange={(e) => setNewField((s) => ({ ...s, data_type: e.target.value }))}
                    >
                      <option value="text">text</option>
                      <option value="long_text">long_text</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="date">date</option>
                      <option value="picklist">picklist</option>
                      <option value="lookup">lookup</option>
                    </select>
                    <Input placeholder="value_set (optional)" value={newField.value_set_api_name} onChange={(e) => setNewField((s) => ({ ...s, value_set_api_name: e.target.value }))} />
                    <Button disabled={busy} onClick={() => void extendField()}>Add field</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {section === "picklists" && (
        <div role="tabpanel">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Picklists</CardTitle>
              <CardDescription>Create value sets and add options for picklist fields.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input placeholder="value_set api_name" value={newVs.api_name} onChange={(e) => setNewVs((s) => ({ ...s, api_name: e.target.value }))} />
                <Input placeholder="Label" value={newVs.label} onChange={(e) => setNewVs((s) => ({ ...s, label: e.target.value }))} />
                <Input placeholder="First option (optional)" value={newVs.option} onChange={(e) => setNewVs((s) => ({ ...s, option: e.target.value }))} />
                <Button disabled={busy} onClick={() => void createValueSet()}>Create picklist</Button>
              </div>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={addOpt.vs} onChange={(e) => setAddOpt((s) => ({ ...s, vs: e.target.value }))}
                >
                  <option value="">Select picklist…</option>
                  {valueSets.map((v) => (
                    <option key={v.api_name} value={v.api_name}>{v.label || v.api_name}</option>
                  ))}
                </select>
                <Input placeholder="api_value" value={addOpt.api_value} onChange={(e) => setAddOpt((s) => ({ ...s, api_value: e.target.value }))} />
                <Input placeholder="Label" value={addOpt.label} onChange={(e) => setAddOpt((s) => ({ ...s, label: e.target.value }))} />
                <Button disabled={busy || !addOpt.vs} onClick={() => void addOption()}>Add option</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

