"use client";

/**
 * Print menu on a record (1.0.27, state_printing.md §3). Lists the record's print templates,
 * the one whose Use when fits first; Open PDF and Download use GET /api/records/<id>/print,
 * Save to Documents & Photos uses POST. Shows nothing when the type has no template.
 */
import { useEffect, useRef, useState } from "react";

type Choice = { id: string; name: string; matches: boolean; default: boolean };

export function PrintMenu({
  recordId,
  className,
  onSaved,
  onError,
}: {
  recordId: string;
  className: string;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [templates, setTemplates] = useState<Choice[]>([]);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/records/${recordId}/print-templates`, { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: Choice[] }) => {
        const list = json.data ?? [];
        setTemplates(list);
        setChosen((list.find((t) => t.default) ?? list[0])?.id ?? "");
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [recordId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!templates.length) return null;
  const url = (download: boolean) =>
    `/api/records/${recordId}/print?template=${encodeURIComponent(chosen)}${download ? "&download=1" : ""}`;

  const save = async () => {
    setBusy(true);
    onError("");
    try {
      const res = await fetch(`/api/records/${recordId}/print`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: chosen }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        onError(json?.error?.message ?? "Printing did not work.");
        return;
      }
      setOpen(false);
      onSaved(`${json?.data?.file?.name ?? "PDF"} saved to Documents & Photos`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={box} className="relative">
      <button type="button" className={className} onClick={() => setOpen((v) => !v)} aria-expanded={open} title="Print this record">
        Print ▾
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-80 rounded-md border border-border bg-card p-3 shadow-lg" role="dialog" aria-label="Print">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Template</span>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={chosen}
              onChange={(e) => setChosen(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.matches ? "" : " (not this kind of record)"}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 flex flex-col gap-2">
            <a className={className + " text-center"} href={url(false)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              Open PDF
            </a>
            <a className={className + " text-center"} href={url(true)} onClick={() => setOpen(false)}>
              Download PDF
            </a>
            <button type="button" className={className} disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save PDF to Documents & Photos"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
