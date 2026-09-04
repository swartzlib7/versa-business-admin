"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_NAV_ITEMS, MENU_ORDER_EVENT, defaultNavHrefs, orderNavItems } from "@/lib/nav";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export function MenuOrderPanel() {
  const [order, setOrder] = useState<string[]>(defaultNavHrefs());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((json: { data?: { menu_order?: string[] } }) => {
        setOrder(orderNavItems(DEFAULT_NAV_ITEMS, json.data?.menu_order).map((item) => item.href));
      })
      .catch(() => setError("Could not load menu order."))
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (next: string[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_order: next }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "Save failed.");
        return;
      }
      const json = await res.json();
      const saved = orderNavItems(DEFAULT_NAV_ITEMS, json.data?.menu_order).map((item) => item.href);
      setOrder(saved);
      window.dispatchEvent(new CustomEvent(MENU_ORDER_EVENT, { detail: saved }));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reorder = (from: string, to: string) => {
    if (from === to) return;
    const next = [...order];
    const fromIdx = next.indexOf(from);
    const toIdx = next.indexOf(to);
    if (fromIdx < 0 || toIdx < 0) return;
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setOrder(next);
    void persist(next);
  };

  const items = orderNavItems(DEFAULT_NAV_ITEMS, order);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag items to reorder the sidebar, the same way table columns work.
        New items stay at the bottom until you move them.
      </p>
      <ol className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li
            key={item.href}
            draggable={loaded && !saving}
            title="Drag to reorder"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", item.href);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOver(item.href);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              reorder(e.dataTransfer.getData("text/plain"), item.href);
              setDragOver(null);
            }}
            onDragEnd={() => setDragOver(null)}
            className={cn(
              "flex items-center gap-3 px-3 py-2",
              loaded && !saving && "cursor-grab active:cursor-grabbing",
              dragOver === item.href && "bg-muted",
            )}
            style={
              dragOver === item.href
                ? { boxShadow: `inset 3px 0 0 ${theme.colors.brand}` }
                : undefined
            }
          >
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        disabled={saving || !loaded}
        onClick={() => void persist(defaultNavHrefs())}
      >
        Reset to default
      </Button>
      {saving ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
