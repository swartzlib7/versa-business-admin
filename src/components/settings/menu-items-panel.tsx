"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BooleanSwitch } from "@/components/ui/boolean-switch";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_NAV_ITEMS,
  DEFAULT_PUBLIC_NAV_ITEMS,
  LOCKED_OPERATOR_HREFS,
  MENU_ORDER_EVENT,
  defaultNavHrefs,
  defaultPublicNavHrefs,
  orderNavItems,
  withToggledHref,
  type NavItem,
  type PublicNavItem,
} from "@/lib/nav";
import { theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

type MenuKind = "operator" | "public";

function dispatchMenuChange() {
  window.dispatchEvent(new CustomEvent(MENU_ORDER_EVENT));
}

export function MenuItemsPanel({ kind }: { kind: MenuKind }) {
  const isOperator = kind === "operator";
  const catalog = isOperator ? DEFAULT_NAV_ITEMS : DEFAULT_PUBLIC_NAV_ITEMS;
  const defaults = isOperator ? defaultNavHrefs() : defaultPublicNavHrefs();
  const locked = isOperator ? LOCKED_OPERATOR_HREFS : [];
  const orderKey = isOperator ? "menu_order" : "public_menu_order";
  const enabledKey = isOperator ? "menu_enabled" : "public_menu_enabled";

  const [order, setOrder] = useState<string[]>(defaults);
  const [enabled, setEnabled] = useState<string[]>(defaults);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    const isOp = kind === "operator";
    const list = isOp ? DEFAULT_NAV_ITEMS : DEFAULT_PUBLIC_NAV_ITEMS;
    const fallback = isOp ? defaultNavHrefs() : defaultPublicNavHrefs();
    const ok = isOp ? "menu_order" : "public_menu_order";
    const ek = isOp ? "menu_enabled" : "public_menu_enabled";
    fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((json: { data?: Record<string, unknown> }) => {
        const nextOrder = Array.isArray(json.data?.[ok])
          ? (json.data[ok] as string[])
          : fallback;
        const nextEnabled = Array.isArray(json.data?.[ek])
          ? (json.data[ek] as string[])
          : fallback;
        setOrder(orderNavItems(list, nextOrder).map((item) => item.href));
        setEnabled(nextEnabled);
      })
      .catch(() => setError("Could not load menu."))
      .finally(() => setLoaded(true));
  }, [kind]);

  const persist = async (next: { order?: string[]; enabled?: string[] }) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          [orderKey]: next.order ?? order,
          [enabledKey]: next.enabled ?? enabled,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "Save failed.");
        return;
      }
      const json = await res.json();
      const savedOrder = Array.isArray(json.data?.[orderKey])
        ? (json.data[orderKey] as string[])
        : defaults;
      const savedEnabled = Array.isArray(json.data?.[enabledKey])
        ? (json.data[enabledKey] as string[])
        : defaults;
      setOrder(orderNavItems(catalog, savedOrder).map((item) => item.href));
      setEnabled(savedEnabled);
      dispatchMenuChange();
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
    void persist({ order: next });
  };

  const toggle = (href: string, on: boolean) => {
    if (locked.includes(href) && !on) return;
    const next = withToggledHref(enabled, href, on, locked);
    setEnabled(next);
    void persist({ enabled: next });
  };

  const items = orderNavItems(catalog, order);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isOperator
          ? "Drag to reorder the operator sidebar. Turn an item off to hide it and block its routes. Settings stays on so you can always get back here."
          : "Drag to reorder the visitor header and footer. Turn an item off to hide it; dedicated pages (Glossary, Org Board) also 404. Demo-only items appear on the public site only when Demo mode is on."}
      </p>
      <ol className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => {
          const lockedOn = locked.includes(item.href);
          const on = enabled.includes(item.href);
          const demoOnly = "demoOnly" in item && Boolean((item as PublicNavItem).demoOnly);
          const Icon = "icon" in item ? (item as NavItem).icon : null;
          return (
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
              {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
              <span className={cn("flex-1 text-sm font-medium", !on && "text-muted-foreground")}>
                {item.label}
              </span>
              {demoOnly ? (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  Demo
                </Badge>
              ) : null}
              <BooleanSwitch
                checked={on}
                onChange={(next) => toggle(item.href, next)}
                label={lockedOn ? "On" : on ? "On" : "Off"}
                labelSide="start"
              />
            </li>
          );
        })}
      </ol>
      <Button
        type="button"
        variant="outline"
        disabled={saving || !loaded}
        onClick={() => void persist({ order: defaults, enabled: defaults })}
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
