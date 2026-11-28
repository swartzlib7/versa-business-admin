"use client";

/**
 * Print template maker (1.0.28, state_printing.md §6; mockup approved 2026-11-27).
 *
 * Records Editor → Print Templates: pick a record type, see its templates (Order, Use when,
 * page, where each came from), and make or change one:
 *   - blocks on the left (drag onto the page, or click to add where the selection is),
 *   - the page in the middle: header bands, body, footer bands (click to select),
 *   - settings of the selection on the right (a band's Shows on, a block's fields),
 *   - "How it prints": which band lands on which page,
 *   - Preview PDF: the real PDF of the draft for a chosen record (the same engine as printing).
 */
import { useCallback, useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { bandShows, parsePages, type Band, type Block, type Layout, type ShowsOn } from "@/lib/print/template";

type TypeOption = { api_name: string; label: string; object_api_name: string; active?: boolean };
type FieldMeta = { api_name: string; label: string; data_type: string; zone_role?: string | null; lookup_object_api_name?: string | null };
type Item = { id: string; name: string; status: string; data: Record<string, string>; origin: "shipped" | "edited" | "own"; can_reset: boolean };
type Meta = { name: string; sort_order: string; use_when_field: string; use_when_value: string; page_size: string; orientation: string; margin_mm: string; font: string; status: string };

const input = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50";
const small = "rounded border border-border px-1.5 py-0.5 text-xs hover:bg-muted disabled:opacity-40";

const SHOWS: Array<{ id: ShowsOn; label: string }> = [
  { id: "every", label: "Every page" },
  { id: "first", label: "First page only" },
  { id: "after_first", label: "Every page after the first" },
  { id: "last", label: "Last page only" },
  { id: "pages", label: "Chosen pages" },
];
const showsLabel = (b: Band) => (SHOWS.find((s) => s.id === b.shows_on)?.label ?? "Every page") + (b.shows_on === "pages" ? ` (${b.pages ?? ""})` : "");

const PALETTE: Array<{ type: Block["type"]; label: string; hint: string }> = [
  { type: "text", label: "Text", hint: "Words, with {fields}" },
  { type: "fields", label: "Fields", hint: "Label and value grid" },
  { type: "organization", label: "Organization", hint: "Name, address, logo" },
  { type: "lines", label: "Lines table", hint: "Columns and totals" },
  { type: "signature", label: "Signature", hint: "Lines to sign on" },
  { type: "page_number", label: "Page number", hint: "Page n of N" },
  { type: "columns", label: "Columns", hint: "Blocks side by side" },
  { type: "divider", label: "Divider", hint: "A thin rule" },
  { type: "spacer", label: "Spacer", hint: "Empty space" },
];

// ── layout paths: "body", "bands.0.blocks", "body.2.columns.1" are block lists ──

type Sel = { list: string; index: number } | { band: number } | null;

function getList(layout: Layout, path: string): Block[] {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = layout;
  for (const p of parts) cur = cur?.[/^\d+$/.test(p) ? Number(p) : p];
  return Array.isArray(cur) ? cur : [];
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function parseLayout(raw: string | undefined): Layout {
  try {
    const v = JSON.parse(raw || "{}");
    return { bands: Array.isArray(v.bands) ? v.bands : [], body: Array.isArray(v.body) ? v.body : [] };
  } catch {
    return { bands: [], body: [] };
  }
}

function newBlock(type: Block["type"], fields: FieldMeta[]): Block {
  const header = fields.filter((f) => f.zone_role !== "list");
  const lines = fields.filter((f) => f.zone_role === "list");
  switch (type) {
    case "text":
      return { type: "text", text: "New text" };
    case "fields":
      return { type: "fields", fields: header.filter((f) => f.api_name !== "name").slice(0, 2).map((f) => f.api_name), columns: 2 };
    case "organization":
      return { type: "organization", source: "own" };
    case "lines":
      return { type: "lines", columns: lines.slice(0, 4).map((f) => ({ field: f.api_name })) };
    case "signature":
      return { type: "signature", label: "Received by", lines: ["Signature", "Printed name", "Date"] };
    case "page_number":
      return { type: "page_number", format: "Page {page} of {pages}", align: "right" };
    case "columns":
      return { type: "columns", columns: [[], []] };
    case "spacer":
      return { type: "spacer", height: 4 };
    default:
      return { type: "divider" };
  }
}

function starterLayout(fields: FieldMeta[], typeLabel: string): Layout {
  const hasLines = fields.some((f) => f.zone_role === "list");
  return {
    bands: [{ id: "page-number", area: "footer", shows_on: "every", blocks: [{ type: "page_number", format: "Page {page} of {pages}", align: "right" }] }],
    body: [
      { type: "columns", widths: [3, 2], columns: [[{ type: "organization", source: "own" }], [{ type: "text", text: typeLabel.toUpperCase(), size: 18, bold: true, align: "right" }]] },
      { type: "divider" },
      newBlock("fields", fields),
      ...(hasLines ? [newBlock("lines", fields)] : []),
    ],
  };
}

const originBadge: Record<Item["origin"], { label: string; cls: string }> = {
  shipped: { label: "Shipped", cls: "bg-teal-500/15 text-teal-700 dark:text-teal-300" },
  edited: { label: "Edited", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  own: { label: "Own", cls: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
};

async function api<T = unknown>(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; json: T | null; error: string }> {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
  const json = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  return { ok: res.ok, status: res.status, json, error: json?.error?.message ?? (res.ok ? "" : `That did not work (${res.status}).`) };
}

// ── The tab: type picker, list, and the maker ─────────────────────────────

export function PrintTemplatesEditor({ types, initialType }: { types: TypeOption[]; initialType?: string }) {
  const choices = useMemo(
    () => types.filter((t) => t.active !== false && t.api_name !== "print_template").sort((a, b) => a.label.localeCompare(b.label)),
    [types],
  );
  const [type, setType] = useState(initialType && choices.some((t) => t.api_name === initialType) ? initialType : "treasury_transaction");
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const [reload, setReload] = useState(0);
  const load = useCallback(() => setReload((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    void api<{ data: Item[] }>(`/api/print-templates?type=${encodeURIComponent(type)}`).then((r) => {
      if (live) setItems(r.json?.data ?? []);
    });
    return () => {
      live = false;
    };
  }, [type, reload]);

  const typeLabel = choices.find((t) => t.api_name === type)?.label ?? type;

  if (editing) {
    return (
      <TemplateMaker
        type={type}
        typeLabel={typeLabel}
        template={editing === "new" ? null : editing}
        onBack={(note) => {
          setEditing(null);
          setMessage(note ?? "");
          setError("");
          load();
        }}
      />
    );
  }

  const act = async (key: string, run: () => Promise<{ ok: boolean; error: string }>, done: string) => {
    setBusy(key);
    setError("");
    setMessage("");
    const r = await run();
    setBusy("");
    if (!r.ok) setError(r.error);
    else setMessage(done);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Record type</span>
          <select className={input + " min-w-56"} value={type} onChange={(e) => setType(e.target.value)} aria-label="Record type">
            {choices.map((t) => (
              <option key={t.api_name} value={t.api_name}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <p className="max-w-3xl flex-1 text-sm text-muted-foreground">
          When a record is printed, the first template whose Use when fits is offered first. Any template of the type can be picked instead.
        </p>
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => setEditing("new")}>
          New Template
        </button>
      </div>
      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
      {message ? <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">{message}</div> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Use when</th>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  {typeLabel} has no print templates yet. New Template starts one.
                </td>
              </tr>
            ) : null}
            {items.map((t) => {
              const archived = (t.status || "").toLowerCase() === "archived";
              return (
                <tr key={t.id} className={"border-b border-border/60 last:border-0 " + (archived ? "opacity-60" : "")}>
                  <td className="px-3 py-2 text-muted-foreground">{t.data.sort_order || "—"}</td>
                  <td className="px-3 py-2 font-medium">
                    {t.name}
                    {archived ? <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Archived</span> : null}
                  </td>
                  <td className="px-3 py-2">{t.data.use_when_field ? `${t.data.use_when_field} = ${t.data.use_when_value || "(empty)"}` : "Any record"}</td>
                  <td className="px-3 py-2">
                    {(t.data.page_size || "letter").replace(/^./, (c) => c.toUpperCase())} · {(t.data.orientation || "portrait").replace(/^./, (c) => c.toUpperCase())}
                  </td>
                  <td className="px-3 py-2">
                    <span className={"rounded-full px-2 py-0.5 text-xs " + originBadge[t.origin].cls}>{originBadge[t.origin].label}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button type="button" className={btn} onClick={() => setEditing(t)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={btn}
                        disabled={!!busy}
                        onClick={() => void act(`dup-${t.id}`, () => api(`/api/records/${t.id}/clone`, { method: "POST" }), `Copy of ${t.name} made.`)}
                      >
                        Duplicate
                      </button>
                      {t.can_reset ? (
                        <button
                          type="button"
                          className={btn}
                          disabled={!!busy}
                          onClick={() => {
                            if (window.confirm(`Put "${t.name}" back as this release ships it? Your changes to it are replaced.`)) {
                              void act(`reset-${t.id}`, () => api(`/api/print-templates/${t.id}/reset`, { method: "POST" }), `${t.name} is back as shipped.`);
                            }
                          }}
                        >
                          Reset to shipped
                        </button>
                      ) : null}
                      {t.origin === "own" ? (
                        <button
                          type="button"
                          className={btn + " border-destructive/50 text-destructive"}
                          disabled={!!busy}
                          onClick={() => {
                            if (window.confirm(`Delete "${t.name}"?`)) void act(`del-${t.id}`, () => api(`/api/records/${t.id}`, { method: "DELETE" }), `${t.name} deleted.`);
                          }}
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={btn}
                          disabled={!!busy}
                          title="A shipped template comes back if deleted; archive it to stop offering it."
                          onClick={() =>
                            void act(
                              `arch-${t.id}`,
                              () => api(`/api/records/${t.id}`, { method: "PATCH", body: JSON.stringify({ status: archived ? "active" : "archived", data: { ...t.data, status: archived ? "active" : "archived" } }) }),
                              archived ? `${t.name} is offered again.` : `${t.name} archived: no longer offered.`,
                            )
                          }
                        >
                          {archived ? "Restore" : "Archive"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Shipped", "Comes with the release. A later release updates it while it is still exactly as shipped."],
          ["Edited", "Changed on this install. Releases leave it alone. Reset to shipped puts the release's version back."],
          ["Own", "Made on this install with New Template or Duplicate."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-border p-3 text-sm">
            <div className="font-semibold">{title}</div>
            <div className="text-muted-foreground">{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── The maker ─────────────────────────────────────────────────────────────

function TemplateMaker({ type, typeLabel, template, onBack }: { type: string; typeLabel: string; template: Item | null; onBack: (note?: string) => void }) {
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [records, setRecords] = useState<Array<{ id: string; name: string }>>([]);
  const [meta, setMeta] = useState<Meta>(() => ({
    name: template?.name ?? `${typeLabel} print`,
    sort_order: template?.data.sort_order ?? "50",
    use_when_field: template?.data.use_when_field ?? "",
    use_when_value: template?.data.use_when_value ?? "",
    page_size: template?.data.page_size || "letter",
    orientation: template?.data.orientation || "portrait",
    margin_mm: template?.data.margin_mm || "15",
    font: template?.data.font || "helvetica",
    status: template?.data.status || template?.status || "active",
  }));
  const [layout, setLayout] = useState<Layout>(() => parseLayout(template?.data.layout));
  const [sel, setSel] = useState<Sel>(null);
  const [previewRecord, setPreviewRecord] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pages, setPages] = useState(3);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    void api<{ data?: { fields?: FieldMeta[] } }>(`/api/catalog/record-types/${type}`).then((r) => {
      const list = (r.json?.data?.fields ?? []).filter((f) => f.data_type !== "attachments" || f.zone_role !== "list");
      setFields(list);
      if (!template) setLayout(starterLayout(list, typeLabel));
    });
    void api<{ data?: Array<{ id: string; name: string }> }>(`/api/records?type=${encodeURIComponent(type)}`).then((r) => {
      const rows = (r.json?.data ?? []).map((x) => ({ id: x.id, name: x.name }));
      setRecords(rows.slice(0, 300));
      setPreviewRecord((cur) => cur || rows[0]?.id || "");
    });
  }, [type, template, typeLabel]);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const header = fields.filter((f) => f.zone_role !== "list");
  const lineFields = fields.filter((f) => f.zone_role === "list");
  const label = (api: string) => (api === "name" ? "Name" : fields.find((f) => f.api_name === api)?.label ?? api);

  const change = (fn: (l: Layout) => void) => {
    setLayout((cur) => {
      const next = clone(cur);
      fn(next);
      return next;
    });
    setNote("");
  };

  /** The list new blocks go into: the selected band, or beside the selected block, else the body. */
  const target = (): { list: string; at: number } => {
    if (sel && "band" in sel) return { list: `bands.${sel.band}.blocks`, at: layout.bands[sel.band]?.blocks.length ?? 0 };
    if (sel && "list" in sel) {
      const b = getList(layout, sel.list)[sel.index];
      if (b?.type === "columns") return { list: `${sel.list}.${sel.index}.columns.0`, at: b.columns[0]?.length ?? 0 };
      return { list: sel.list, at: sel.index + 1 };
    }
    return { list: "body", at: layout.body.length };
  };

  const insert = (type: Block["type"], list: string, at: number) => {
    if (type === "lines" && list.startsWith("bands")) {
      setError("The lines table goes in the body, not in a header or footer.");
      return;
    }
    change((l) => getList(l, list).splice(at, 0, newBlock(type, fields)));
    setSel({ list, index: at });
    setError("");
  };

  const addBand = (area: "header" | "footer") => {
    change((l) => l.bands.push({ id: `${area}-${l.bands.length + 1}`, area, shows_on: "every", blocks: [] }));
    setSel({ band: layout.bands.length });
  };

  const onDrop = (e: DragEvent, list: string) => {
    e.preventDefault();
    e.stopPropagation();
    const kind = e.dataTransfer.getData("text/x-print-block") as Block["type"];
    if (kind) insert(kind, list, getList(layout, list).length);
  };
  const dropProps = (list: string) => ({
    onDragOver: (e: DragEvent) => {
      if (e.dataTransfer.types.includes("text/x-print-block")) e.preventDefault();
    },
    onDrop: (e: DragEvent) => onDrop(e, list),
  });

  const templateData = () => ({
    ...(template?.data ?? {}),
    ...meta,
    target_record_type: type,
    layout: JSON.stringify(layout, null, 2),
  });

  const preview = async () => {
    if (!previewRecord) {
      setError(`Make a ${typeLabel} record first: the preview prints a real one.`);
      return;
    }
    setBusy("preview");
    setError("");
    const res = await fetch("/api/print-templates/preview", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_id: previewRecord, template: templateData() }),
    });
    setBusy("");
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error?.message ?? "The preview did not work.");
      return;
    }
    setPages(Number(res.headers.get("X-Print-Pages")) || 1);
    const blob = await res.blob();
    setPdfUrl(URL.createObjectURL(blob));
  };

  const save = async () => {
    setBusy("save");
    setError("");
    const data = templateData();
    const r = template
      ? await api(`/api/records/${template.id}`, { method: "PATCH", body: JSON.stringify({ name: meta.name, status: meta.status, data }) })
      : await api(`/api/records`, {
          method: "POST",
          body: JSON.stringify({ type_api_name: "print_template", parent_kind: "environment", parent_api_name: "custom", name: meta.name, status: meta.status, data }),
        });
    setBusy("");
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onBack(`${meta.name} saved.`);
  };

  const selectedBlock = sel && "list" in sel ? getList(layout, sel.list)[sel.index] : undefined;
  const selectedBand = sel && "band" in sel ? layout.bands[sel.band] : undefined;
  const headers = layout.bands.map((b, i) => ({ b, i })).filter((x) => x.b.area === "header");
  const footers = layout.bands.map((b, i) => ({ b, i })).filter((x) => x.b.area === "footer");

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
        <button type="button" className={btn} onClick={() => onBack()}>
          ← All templates
        </button>
        <Labeled label="Template name" className="min-w-48 flex-1">
          <input className={input} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} aria-label="Template name" />
        </Labeled>
        <Labeled label="Order" className="w-20">
          <input className={input} type="number" value={meta.sort_order} onChange={(e) => setMeta({ ...meta, sort_order: e.target.value })} aria-label="Order" />
        </Labeled>
        <Labeled label="Use when">
          <div className="flex items-center gap-1.5">
            <select className={input} value={meta.use_when_field} onChange={(e) => setMeta({ ...meta, use_when_field: e.target.value })} aria-label="Use when field">
              <option value="">Any record</option>
              {header
                .filter((f) => ["picklist", "text", "boolean"].includes(f.data_type) || f.api_name === "status")
                .map((f) => (
                  <option key={f.api_name} value={f.api_name}>
                    {f.label}
                  </option>
                ))}
            </select>
            <span className="text-muted-foreground">=</span>
            <input className={input + " w-32"} value={meta.use_when_value} disabled={!meta.use_when_field} placeholder="e.g. invoice" onChange={(e) => setMeta({ ...meta, use_when_value: e.target.value })} aria-label="Use when value" />
          </div>
        </Labeled>
        <Labeled label="Page">
          <div className="flex gap-1.5">
            <select className={input} value={meta.page_size} onChange={(e) => setMeta({ ...meta, page_size: e.target.value })} aria-label="Paper">
              <option value="letter">Letter</option>
              <option value="a4">A4</option>
              <option value="legal">Legal</option>
            </select>
            <select className={input} value={meta.orientation} onChange={(e) => setMeta({ ...meta, orientation: e.target.value })} aria-label="Orientation">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
            <select className={input} value={meta.margin_mm} onChange={(e) => setMeta({ ...meta, margin_mm: e.target.value })} aria-label="Margins">
              {["10", "12", "15", "20", "25"].map((m) => (
                <option key={m} value={m}>
                  Margins {m} mm
                </option>
              ))}
            </select>
            <select className={input} value={meta.font} onChange={(e) => setMeta({ ...meta, font: e.target.value })} aria-label="Font">
              <option value="helvetica">Helvetica</option>
              <option value="times">Times</option>
              <option value="hack">Hack (app font)</option>
            </select>
          </div>
        </Labeled>
        <Labeled label="Status">
          <select className={input} value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })} aria-label="Status">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Labeled>
        <Labeled label="Preview with">
          <select className={input + " max-w-56"} value={previewRecord} onChange={(e) => setPreviewRecord(e.target.value)} aria-label="Preview with">
            {records.length === 0 ? <option value="">No {typeLabel} yet</option> : null}
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Labeled>
        <button type="button" className={btn} disabled={!!busy} onClick={() => void preview()}>
          {busy === "preview" ? "Printing…" : "Preview PDF"}
        </button>
        <button type="button" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!!busy} onClick={() => void save()}>
          {busy === "save" ? "Saving…" : "Save"}
        </button>
      </div>
      {template?.origin === "shipped" ? (
        <p className="text-xs text-muted-foreground">A shipped template: once you save a change, later releases leave it alone (Reset to shipped puts theirs back).</p>
      ) : null}
      {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
      {note ? <div className="text-sm text-muted-foreground">{note}</div> : null}

      <div className="grid gap-3 lg:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        {/* Blocks */}
        <aside className="space-y-2 rounded-lg border border-border p-3" aria-label="Blocks">
          <div>
            <div className="text-sm font-semibold">Blocks</div>
            <div className="text-xs text-muted-foreground">Drag onto the page, or click to add where the selection is.</div>
          </div>
          {PALETTE.map((p) => (
            <button
              key={p.type}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/x-print-block", p.type);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => {
                const t = target();
                insert(p.type, t.list, t.at);
              }}
              className="block w-full cursor-grab rounded-md border border-border px-2.5 py-1.5 text-left hover:bg-muted"
            >
              <span className="block text-sm">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.hint}</span>
            </button>
          ))}
          <div className="flex gap-1.5 pt-1">
            <button type="button" className={btn + " flex-1"} onClick={() => addBand("header")}>
              + Header
            </button>
            <button type="button" className={btn + " flex-1"} onClick={() => addBand("footer")}>
              + Footer
            </button>
          </div>
        </aside>

        {/* The page */}
        <section className="space-y-3" aria-label="Page">
          <div className="mx-auto w-full max-w-[640px] rounded-sm bg-white p-5 text-[12px] text-neutral-900 shadow-md">
            {headers.map(({ b, i }) => (
              <BandBox key={`h${i}`} band={b} index={i} selected={!!sel && "band" in sel && sel.band === i} onSelect={() => setSel({ band: i })} dropProps={dropProps(`bands.${i}.blocks`)}>
                <BlockList layout={layout} path={`bands.${i}.blocks`} sel={sel} setSel={setSel} change={change} label={label} dropProps={dropProps} />
              </BandBox>
            ))}
            <div className="my-2 min-h-24 rounded border border-dashed border-neutral-300 p-2" {...dropProps("body")} aria-label="Body">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Body</div>
              <BlockList layout={layout} path="body" sel={sel} setSel={setSel} change={change} label={label} dropProps={dropProps} />
            </div>
            {footers.map(({ b, i }) => (
              <BandBox key={`f${i}`} band={b} index={i} selected={!!sel && "band" in sel && sel.band === i} onSelect={() => setSel({ band: i })} dropProps={dropProps(`bands.${i}.blocks`)}>
                <BlockList layout={layout} path={`bands.${i}.blocks`} sel={sel} setSel={setSel} change={change} label={label} dropProps={dropProps} />
              </BandBox>
            ))}
          </div>

          {/* How it prints */}
          <div className="rounded-lg border border-border p-3">
            <div className="text-sm font-semibold">How it prints</div>
            <div className="mb-2 text-xs text-muted-foreground">
              {(pdfUrl ? `The preview record runs to ${pages} page${pages === 1 ? "" : "s"}.` : "Shown for 3 pages until you preview.") + " Change a band's Shows on to see it move."}
            </div>
            <div className="flex gap-3 overflow-x-auto">
              {Array.from({ length: Math.min(Math.max(pages, 1), 8) }, (_, k) => k + 1).map((p) => {
                const n = Math.min(Math.max(pages, 1), 8);
                return (
                  <div key={p} className="w-28 shrink-0 rounded border border-border bg-white p-1.5 text-[9px] text-neutral-800" aria-label={`Page ${p}`}>
                    {headers.filter(({ b }) => bandShows(b, p, n)).map(({ b, i }) => (
                      <div key={i} className="mb-1 truncate rounded bg-indigo-100 px-1 py-0.5">{b.id || "Header"}</div>
                    ))}
                    <div className="mb-1 h-10 rounded bg-neutral-100 px-1 py-0.5">Body</div>
                    {footers.filter(({ b }) => bandShows(b, p, n)).map(({ b, i }) => (
                      <div key={i} className="mb-1 truncate rounded bg-orange-100 px-1 py-0.5">{b.id || "Footer"}</div>
                    ))}
                    <div className="text-center text-neutral-500">Page {p}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {pdfUrl ? (
            <div className="rounded-lg border border-border p-2">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold">Preview PDF</span>
                <a className="text-xs underline" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Open in a new tab
                </a>
              </div>
              <iframe title="Preview PDF" src={pdfUrl} className="h-[720px] w-full rounded bg-white" />
            </div>
          ) : null}

          <details
            className="rounded-lg border border-border p-3 text-sm"
            open={showJson}
            onToggle={(e) => {
              const open = (e.target as HTMLDetailsElement).open;
              setShowJson(open);
              if (open) setJsonText(JSON.stringify(layout, null, 2));
            }}
          >
            <summary className="cursor-pointer font-semibold">Layout JSON</summary>
            <p className="my-2 text-xs text-muted-foreground">The same layout as text, for copying between templates or exact edits. docs/agents/printing.md lists every block.</p>
            <textarea className={input + " h-72 font-mono text-xs"} value={jsonText} onChange={(e) => setJsonText(e.target.value)} aria-label="Layout JSON" />
            <button
              type="button"
              className={btn + " mt-2"}
              onClick={() => {
                try {
                  const v = JSON.parse(jsonText);
                  setLayout({ bands: Array.isArray(v.bands) ? v.bands : [], body: Array.isArray(v.body) ? v.body : [] });
                  setSel(null);
                  setError("");
                } catch (err) {
                  setError(`Layout JSON: ${err instanceof Error ? err.message : String(err)}`);
                }
              }}
            >
              Use this JSON
            </button>
          </details>
        </section>

        {/* Settings of the selection */}
        <aside className="space-y-3 rounded-lg border border-border p-3" aria-label="Settings">
          {selectedBand && sel && "band" in sel ? (
            <BandSettings
              band={selectedBand}
              onChange={(patch) => change((l) => Object.assign(l.bands[sel.band], patch))}
              onMove={(d) =>
                change((l) => {
                  const j = sel.band + d;
                  if (j < 0 || j >= l.bands.length) return;
                  [l.bands[sel.band], l.bands[j]] = [l.bands[j], l.bands[sel.band]];
                  setSel({ band: j });
                })
              }
              onRemove={() => {
                change((l) => l.bands.splice(sel.band, 1));
                setSel(null);
              }}
            />
          ) : selectedBlock && sel && "list" in sel ? (
            <BlockSettings
              block={selectedBlock}
              header={header}
              lineFields={lineFields}
              label={label}
              onChange={(patch) => change((l) => Object.assign(getList(l, sel.list)[sel.index], patch))}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Click a band or a block on the page to change it. Bands are the headers and footers; each says which pages it shows on.</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Labeled({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={"space-y-1 " + (className ?? "")}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function BandBox({
  band,
  index,
  selected,
  onSelect,
  dropProps,
  children,
}: {
  band: Band;
  index: number;
  selected: boolean;
  onSelect: () => void;
  dropProps: { onDragOver: (e: DragEvent) => void; onDrop: (e: DragEvent) => void };
  children: ReactNode;
}) {
  const isHeader = band.area === "header";
  return (
    <div
      className={"my-1 rounded border p-1.5 " + (selected ? "border-2 border-indigo-500" : "border-dashed " + (isHeader ? "border-indigo-300 bg-indigo-50/50" : "border-orange-300 bg-orange-50/60"))}
      {...dropProps}
    >
      <button type="button" onClick={onSelect} className={"mb-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide " + (selected ? "bg-indigo-500 text-white" : isHeader ? "bg-indigo-100 text-indigo-900" : "bg-orange-100 text-orange-900")} aria-label={`Band ${index + 1}: ${band.area}, ${showsLabel(band)}`}>
        {band.area} · {showsLabel(band)}
      </button>
      {children}
    </div>
  );
}

function BlockList({
  layout,
  path,
  sel,
  setSel,
  change,
  label,
  dropProps,
}: {
  layout: Layout;
  path: string;
  sel: Sel;
  setSel: (s: Sel) => void;
  change: (fn: (l: Layout) => void) => void;
  label: (api: string) => string;
  dropProps: (list: string) => { onDragOver: (e: DragEvent) => void; onDrop: (e: DragEvent) => void };
}) {
  const blocks = getList(layout, path);
  if (!blocks.length) return <div className="px-1 py-2 text-[10px] text-neutral-400">Drop blocks here</div>;
  return (
    <div className="space-y-1">
      {blocks.map((b, i) => {
        const on = !!sel && "list" in sel && sel.list === path && sel.index === i;
        const move = (d: number) =>
          change((l) => {
            const list = getList(l, path);
            const j = i + d;
            if (j < 0 || j >= list.length) return;
            [list[i], list[j]] = [list[j], list[i]];
            setSel({ list: path, index: j });
          });
        return (
          <div key={i} className={"rounded border " + (on ? "border-2 border-indigo-500 bg-indigo-50/40" : "border-dashed border-neutral-300")}>
            <div className="flex items-start gap-1">
              <button type="button" className="min-w-0 flex-1 px-1.5 py-1 text-left" onClick={() => setSel({ list: path, index: i })}>
                <span className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{PALETTE.find((p) => p.type === b.type)?.label ?? b.type}</span>
                <BlockSketch block={b} label={label} />
              </button>
              {on ? (
                <span className="flex shrink-0 gap-0.5 p-1">
                  <button type="button" className={small} onClick={() => move(-1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className={small} onClick={() => move(1)} aria-label="Move down">
                    ↓
                  </button>
                  <button
                    type="button"
                    className={small}
                    onClick={() => {
                      change((l) => getList(l, path).splice(i, 1));
                      setSel(null);
                    }}
                    aria-label="Remove block"
                  >
                    ✕
                  </button>
                </span>
              ) : null}
            </div>
            {b.type === "columns" ? (
              <div className="flex gap-1.5 px-1.5 pb-1.5">
                {b.columns.map((_, c) => (
                  <div key={c} className="min-w-0 flex-1 rounded border border-dotted border-neutral-300 p-1" style={{ flexGrow: Number(b.widths?.[c] ?? 1) }} {...dropProps(`${path}.${i}.columns.${c}`)}>
                    <BlockList layout={layout} path={`${path}.${i}.columns.${c}`} sel={sel} setSel={setSel} change={change} label={label} dropProps={dropProps} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function BlockSketch({ block, label }: { block: Block; label: (api: string) => string }) {
  switch (block.type) {
    case "text":
      return <span className={"block whitespace-pre-wrap " + (block.bold ? "font-bold " : "") + (block.muted ? "text-neutral-500" : "")} style={{ fontSize: Math.min(22, (block.size ?? 9.5) * 1.15), textAlign: block.align ?? "left" }}>{block.text}</span>;
    case "fields":
      return <span className="block">{block.fields.map(label).join(" · ") || "No fields chosen"}</span>;
    case "organization":
      return (
        <span className="block">
          {block.title ? <b className="mr-1 text-[9px] uppercase">{block.title}</b> : null}
          {block.source === "own" ? "Your organization" : label(block.source)}
          {block.location ? ` → ${block.location === "primary" ? "Primary address" : label(block.location)}` : ""}
        </span>
      );
    case "lines":
      return (
        <span className="block">
          <span className="flex gap-1 rounded bg-neutral-100 px-1 py-0.5 text-[10px] font-semibold">
            {block.columns.map((c, i) => (
              <span key={i} className="min-w-0 flex-1 truncate" style={{ flexGrow: Number(c.width ?? 1) }}>
                {c.label ?? label(c.field)}
              </span>
            ))}
          </span>
          {block.totals?.length ? <span className="mt-0.5 block text-right text-[10px]">{block.totals.map((t) => t.label ?? label(t.field)).join(" · ")}</span> : null}
        </span>
      );
    case "signature":
      return <span className="block">{block.label ?? "Signature"}: {(block.lines ?? ["Signature", "Printed name", "Date"]).join(" / ")}</span>;
    case "page_number":
      return <span className="block text-right text-neutral-500">{(block.format ?? "Page {page} of {pages}").replace("{page}", "1").replace("{pages}", "3")}</span>;
    case "spacer":
      return <span className="block text-neutral-400">{block.height ?? 4} mm</span>;
    case "divider":
      return <span className="block border-t border-neutral-400" />;
    case "columns":
      return <span className="block text-neutral-500">{block.columns.length} columns</span>;
    default:
      return null;
  }
}

function BandSettings({ band, onChange, onMove, onRemove }: { band: Band; onChange: (p: Partial<Band>) => void; onMove: (d: number) => void; onRemove: () => void }) {
  const chosen = band.shows_on === "pages";
  const valid = !chosen || parsePages(band.pages).size > 0;
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold">{band.area === "header" ? "Header" : "Footer"} band</div>
      <Labeled label="Name">
        <input className={input} value={band.id ?? ""} onChange={(e) => onChange({ id: e.target.value })} aria-label="Band name" />
      </Labeled>
      <Labeled label="Area">
        <select className={input} value={band.area} onChange={(e) => onChange({ area: e.target.value as Band["area"] })} aria-label="Area">
          <option value="header">Header (top of the page)</option>
          <option value="footer">Footer (bottom of the page)</option>
        </select>
      </Labeled>
      <fieldset className="space-y-1">
        <legend className="mb-1 text-xs font-medium text-muted-foreground">Shows on</legend>
        {SHOWS.map((s) => (
          <label key={s.id} className="flex items-center gap-2">
            <input type="radio" name="shows-on" checked={band.shows_on === s.id} onChange={() => onChange({ shows_on: s.id, ...(s.id === "pages" && !band.pages ? { pages: "1" } : {}) })} />
            {s.label}
          </label>
        ))}
      </fieldset>
      {chosen ? (
        <Labeled label="Pages (numbers and ranges)">
          <input className={input} value={band.pages ?? ""} placeholder="1, 3, 5-7" onChange={(e) => onChange({ pages: e.target.value })} aria-label="Pages" />
          {!valid ? <span className="text-xs text-destructive">List page numbers, e.g. 1, 3</span> : null}
        </Labeled>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => onMove(-1)}>
          Move up
        </button>
        <button type="button" className={btn} onClick={() => onMove(1)}>
          Move down
        </button>
        <button type="button" className={btn + " border-destructive/50 text-destructive"} onClick={onRemove}>
          Remove band
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Bands in the same area stack in this order. Add blocks by dragging them onto the band, or with the band selected, click a block on the left.</p>
    </div>
  );
}

function PickList({
  chosen,
  options,
  onChange,
  render,
  addLabel,
}: {
  chosen: string[];
  options: FieldMeta[];
  onChange: (next: string[]) => void;
  render?: (api: string, i: number) => ReactNode;
  addLabel: string;
}) {
  const label = (api: string) => options.find((f) => f.api_name === api)?.label ?? api;
  return (
    <div className="space-y-1.5">
      {chosen.map((api, i) => (
        <div key={`${api}-${i}`} className="rounded border border-border p-1.5">
          <div className="flex items-center gap-1">
            <span className="min-w-0 flex-1 truncate text-sm">{label(api)}</span>
            <button type="button" className={small} disabled={i === 0} onClick={() => onChange(chosen.map((x, k) => (k === i - 1 ? chosen[i] : k === i ? chosen[i - 1] : x)))} aria-label={`Move ${label(api)} up`}>
              ↑
            </button>
            <button type="button" className={small} disabled={i === chosen.length - 1} onClick={() => onChange(chosen.map((x, k) => (k === i + 1 ? chosen[i] : k === i ? chosen[i + 1] : x)))} aria-label={`Move ${label(api)} down`}>
              ↓
            </button>
            <button type="button" className={small} onClick={() => onChange(chosen.filter((_, k) => k !== i))} aria-label={`Remove ${label(api)}`}>
              ✕
            </button>
          </div>
          {render ? render(api, i) : null}
        </div>
      ))}
      <select
        className={input}
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...chosen, e.target.value]);
        }}
        aria-label={addLabel}
      >
        <option value="">{addLabel}…</option>
        {options
          .filter((f) => !chosen.includes(f.api_name))
          .map((f) => (
            <option key={f.api_name} value={f.api_name}>
              {f.label}
            </option>
          ))}
      </select>
    </div>
  );
}

const ALIGN = (value: string | undefined, onChange: (a: "left" | "center" | "right") => void) => (
  <Labeled label="Align">
    <select className={input} value={value ?? "left"} onChange={(e) => onChange(e.target.value as "left" | "center" | "right")} aria-label="Align">
      <option value="left">Left</option>
      <option value="center">Center</option>
      <option value="right">Right</option>
    </select>
  </Labeled>
);

function BlockSettings({
  block,
  header,
  lineFields,
  label,
  onChange,
}: {
  block: Block;
  header: FieldMeta[];
  lineFields: FieldMeta[];
  label: (api: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (patch: Record<string, any>) => void;
}) {
  const withName: FieldMeta[] = [{ api_name: "name", label: "Name", data_type: "text" }, ...header.filter((f) => f.api_name !== "name")];
  const orgFields = header.filter((f) => f.data_type === "lookup" && f.lookup_object_api_name === "organization");
  const locFields = header.filter((f) => f.data_type === "lookup" && f.lookup_object_api_name === "location");
  const numeric = header.filter((f) => ["number", "currency", "summary", "formula"].includes(f.data_type));
  const title = PALETTE.find((p) => p.type === block.type)?.label ?? block.type;
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold">{title}</div>
      {block.type === "text" ? (
        <>
          <Labeled label="Text">
            <textarea className={input + " h-24"} value={block.text} onChange={(e) => onChange({ text: e.target.value })} aria-label="Text" />
          </Labeled>
          <select className={input} value="" onChange={(e) => e.target.value && onChange({ text: `${block.text}{${e.target.value}}` })} aria-label="Insert field">
            <option value="">Insert field…</option>
            {[...withName, { api_name: "page", label: "Page number", data_type: "" }, { api_name: "pages", label: "Page count", data_type: "" }, { api_name: "today", label: "Today's date", data_type: "" }].map((f) => (
              <option key={f.api_name} value={f.api_name}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">A field drops in as {"{document_number}"} and prints its value.</p>
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Size">
              <input className={input} type="number" min={6} max={40} value={block.size ?? 9.5} onChange={(e) => onChange({ size: Number(e.target.value) || 9.5 })} aria-label="Size" />
            </Labeled>
            {ALIGN(block.align, (align) => onChange({ align }))}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!block.bold} onChange={(e) => onChange({ bold: e.target.checked })} /> Bold
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!block.muted} onChange={(e) => onChange({ muted: e.target.checked })} /> Grey
          </label>
        </>
      ) : null}
      {block.type === "fields" ? (
        <>
          <p className="text-xs text-muted-foreground">Header fields of the record, label and value. Empty ones are left out when printed.</p>
          <PickList chosen={block.fields} options={withName} onChange={(fields) => onChange({ fields })} addLabel="Add field" />
          <div className="grid grid-cols-2 gap-2">
            <Labeled label="Columns">
              <select className={input} value={block.columns ?? 2} onChange={(e) => onChange({ columns: Number(e.target.value) })} aria-label="Columns">
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Labeled>
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={block.labels !== false} onChange={(e) => onChange({ labels: e.target.checked })} /> Labels
            </label>
          </div>
        </>
      ) : null}
      {block.type === "organization" ? (
        <>
          <p className="text-xs text-muted-foreground">Prints an organization&apos;s name, address (from a Location), phone, email and logo.</p>
          <Labeled label="Organization">
            <select className={input} value={block.source} onChange={(e) => onChange({ source: e.target.value })} aria-label="Organization">
              <option value="own">Your organization</option>
              {orgFields.map((f) => (
                <option key={f.api_name} value={f.api_name}>
                  {f.label}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Address from">
            <select className={input} value={block.location ?? "primary"} onChange={(e) => onChange({ location: e.target.value })} aria-label="Address from">
              <option value="primary">Its Primary address</option>
              {locFields.map((f) => (
                <option key={f.api_name} value={f.api_name}>
                  {f.label}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Title">
            <input className={input} value={block.title ?? ""} placeholder="e.g. Bill to" onChange={(e) => onChange({ title: e.target.value || undefined })} aria-label="Title" />
          </Labeled>
          <fieldset className="space-y-1">
            <legend className="mb-1 text-xs font-medium text-muted-foreground">Shows</legend>
            {(["logo", "name", "address", "phone", "email"] as const).map((k) => {
              const show = block.show ?? ["logo", "name", "address", "phone", "email"];
              return (
                <label key={k} className="flex items-center gap-2 capitalize">
                  <input type="checkbox" checked={show.includes(k)} onChange={(e) => onChange({ show: e.target.checked ? [...show, k] : show.filter((x) => x !== k) })} />
                  {k}
                </label>
              );
            })}
          </fieldset>
          {ALIGN(block.align, (align) => onChange({ align }))}
        </>
      ) : null}
      {block.type === "lines" ? (
        <>
          <Labeled label="Columns (lines fields)">
            <PickList
              chosen={block.columns.map((c) => c.field)}
              options={lineFields}
              addLabel="Add column"
              onChange={(next) => onChange({ columns: next.map((f) => block.columns.find((c) => c.field === f) ?? { field: f }) })}
              render={(api, i) => (
                <div className="mt-1 grid grid-cols-[1fr_4rem] gap-1">
                  <input
                    className={input}
                    value={block.columns[i]?.label ?? ""}
                    placeholder={label(api)}
                    onChange={(e) => onChange({ columns: block.columns.map((c, k) => (k === i ? { ...c, label: e.target.value || undefined } : c)) })}
                    aria-label={`Heading for ${label(api)}`}
                  />
                  <input
                    className={input}
                    type="number"
                    min={0.2}
                    step={0.2}
                    value={block.columns[i]?.width ?? ""}
                    placeholder="width"
                    onChange={(e) => onChange({ columns: block.columns.map((c, k) => (k === i ? { ...c, width: e.target.value ? Number(e.target.value) : undefined } : c)) })}
                    aria-label={`Width of ${label(api)}`}
                  />
                </div>
              )}
            />
          </Labeled>
          <p className="text-xs text-muted-foreground">Column headings repeat on every page; rows never split between pages.</p>
          <Labeled label="Rows">
            <select className={input} value={block.only_with ?? ""} onChange={(e) => onChange({ only_with: e.target.value || undefined })} aria-label="Rows">
              <option value="">All lines, in line order</option>
              {lineFields.map((f) => (
                <option key={f.api_name} value={f.api_name}>
                  Only lines with {f.label}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Totals (header numbers, right-aligned, after the last line)">
            <PickList
              chosen={(block.totals ?? []).map((t) => t.field)}
              options={numeric}
              addLabel="Add total"
              onChange={(next) => onChange({ totals: next.map((f) => (block.totals ?? []).find((t) => t.field === f) ?? { field: f }) })}
              render={(api, i) => (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    className={input}
                    value={block.totals?.[i]?.label ?? ""}
                    placeholder={label(api)}
                    onChange={(e) => onChange({ totals: (block.totals ?? []).map((t, k) => (k === i ? { ...t, label: e.target.value || undefined } : t)) })}
                    aria-label={`Label for ${label(api)}`}
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={!!block.totals?.[i]?.bold} onChange={(e) => onChange({ totals: (block.totals ?? []).map((t, k) => (k === i ? { ...t, bold: e.target.checked } : t)) })} />
                    Bold
                  </label>
                </div>
              )}
            />
          </Labeled>
        </>
      ) : null}
      {block.type === "signature" ? (
        <>
          <Labeled label="Heading">
            <input className={input} value={block.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} aria-label="Heading" />
          </Labeled>
          <Labeled label="Lines (separated by commas)">
            <input className={input} value={(block.lines ?? []).join(", ")} onChange={(e) => onChange({ lines: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} aria-label="Signature lines" />
          </Labeled>
        </>
      ) : null}
      {block.type === "page_number" ? (
        <>
          <Labeled label="Format">
            <input className={input} value={block.format ?? "Page {page} of {pages}"} onChange={(e) => onChange({ format: e.target.value })} aria-label="Format" />
          </Labeled>
          {ALIGN(block.align, (align) => onChange({ align }))}
        </>
      ) : null}
      {block.type === "spacer" ? (
        <Labeled label="Height (mm)">
          <input className={input} type="number" min={1} max={100} value={block.height ?? 4} onChange={(e) => onChange({ height: Number(e.target.value) || 4 })} aria-label="Height" />
        </Labeled>
      ) : null}
      {block.type === "columns" ? (
        <>
          <Labeled label="Columns">
            <select
              className={input}
              value={block.columns.length}
              onChange={(e) => {
                const n = Number(e.target.value);
                const cols = block.columns.slice(0, n);
                while (cols.length < n) cols.push([]);
                onChange({ columns: cols, widths: undefined });
              }}
              aria-label="Number of columns"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Widths (relative, e.g. 3, 2)">
            <input
              className={input}
              value={(block.widths ?? []).join(", ")}
              placeholder="equal"
              onChange={(e) => {
                const w = e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
                onChange({ widths: w.length ? w : undefined });
              }}
              aria-label="Widths"
            />
          </Labeled>
          <p className="text-xs text-muted-foreground">Drag blocks into each column on the page.</p>
        </>
      ) : null}
      {block.type === "divider" ? <p className="text-xs text-muted-foreground">A thin rule across the page.</p> : null}
    </div>
  );
}
