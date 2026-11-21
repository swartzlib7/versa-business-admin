"use client";

/**
 * "Linked from" (1.0.15): the records that point at this one, grouped by type
 * and field - e.g. a project's estimates, invoices and bills, or the invoice
 * lines a vendor bill covers. Read-only; adding from here is a later step.
 */
import { useEffect, useState } from "react";
import type { LinkedGroup } from "@/lib/records/linked-from";
import { useTwinSlot } from "@/components/zones/twin-slot-context";

const money = (raw: string) => {
  const n = Number(raw);
  return raw.trim() !== "" && Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
};

export function LinkedFromPanel({ recordId, accent }: { recordId: string; accent: string }) {
  const { linesEpoch } = useTwinSlot();
  const [groups, setGroups] = useState<LinkedGroup[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/records/${recordId}/linked`, { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: LinkedGroup[] }) => setGroups(json.data ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [recordId, linesEpoch]);

  if (!groups?.length) return null;
  return (
    <section
      className="rounded-lg border border-border bg-card/40 p-4"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
      aria-label="Linked from"
    >
      <h3 className="mb-3 text-sm font-semibold tracking-tight">Linked from</h3>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.type_api_name + ":" + g.field_api_name}>
            <p className="mb-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{g.type_label}</span> · by {g.field_label}
              {g.placement === "lines" ? " (on lines)" : ""} · {g.records.length}
            </p>
            <table className="w-full text-left text-sm">
              <tbody>
                {g.records.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-3">{r.name}</td>
                    {r.kind ? <td className="py-1.5 pr-3 capitalize text-muted-foreground">{r.kind}</td> : null}
                    <td className="py-1.5 pr-3 text-muted-foreground">{r.status}</td>
                    {g.placement === "lines" ? (
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {r.lines} {r.lines === 1 ? "line" : "lines"}
                      </td>
                    ) : null}
                    <td className="py-1.5 text-right tabular-nums">{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {g.totals.length ? (
              <p className="mt-1.5 flex flex-wrap justify-end gap-x-4 text-xs text-muted-foreground">
                {g.totals.map((t) => (
                  <span key={t.kind || "total"}>
                    <span className="capitalize">{t.kind || "Total"}</span>{" "}
                    <b className="tabular-nums text-foreground">{money(t.amount)}</b>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
