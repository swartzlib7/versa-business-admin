"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { useBrand, BrandMark } from "@/components/shell/brand-provider";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DEFAULT_NAV_ITEMS, MENU_ORDER_EVENT, orderNavItems, type NavItem } from "@/lib/nav";

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

export const SIDEBAR_COLLAPSE_EVENT = "mc-sidebar-collapse";
export const SIDEBAR_COLLAPSE_KEY = "mc.sidebarCollapsed";

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
}

export function writeSidebarCollapsed(collapsed: boolean) {
  window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT));
}

// I5.6.6 + board + I5.6.32 (Stephen 2026-07-22): zone menus own IA.
// Order is Settings → System → Menu (instance persist).
// 0.7.141: rail collapses to symbols only.

export function Sidebar({
  variant = "rail",
}: {
  variant?: "rail" | "drawer";
}) {
  const brand = useBrand();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [collapsed, setCollapsed] = useState(false);
  const iconsOnly = variant === "rail" && collapsed;

  const loadMenu = () => {
    void fetch("/api/settings/system", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("menu order unavailable"))))
      .then((json: { data?: { menu_order?: string[]; menu_enabled?: string[] } }) => {
        const ordered = orderNavItems(DEFAULT_NAV_ITEMS, json.data?.menu_order);
        const enabled = new Set(json.data?.menu_enabled ?? ordered.map((item) => item.href));
        setNavItems(ordered.filter((item) => enabled.has(item.href)));
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    loadMenu();
    const onOrder = () => loadMenu();
    window.addEventListener(MENU_ORDER_EVENT, onOrder);
    return () => window.removeEventListener(MENU_ORDER_EVENT, onOrder);
  }, []);

  useEffect(() => {
    if (variant !== "rail") return;
    const sync = () => setCollapsed(readSidebarCollapsed());
    sync();
    window.addEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
    return () => window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, sync);
  }, [variant]);

  const navEntries: NavEntry[] = navItems;

  const initialExpanded = () => {
    const groups: Record<string, boolean> = {};
    navEntries.forEach((entry) => {
      if (isGroup(entry)) {
        const childActive = entry.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + "/")
        );
        if (childActive) groups[entry.label] = true;
      }
    });
    return groups;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleCollapsed = () => {
    writeSidebarCollapsed(!collapsed);
  };

  const itemClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-md text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
      iconsOnly ? "h-9 w-9 justify-center px-0" : "w-full gap-3 px-3 py-2",
      isActive
        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    );

  const activeStyle = (isActive: boolean) =>
    isActive
      ? {
          boxShadow: iconsOnly
            ? `inset 0 0 0 1px ${theme.colors.brand}`
            : `inset 3px 0 0 ${theme.colors.brand}`,
          backgroundColor: `${theme.colors.brand}22`,
          color: theme.colors.brand,
        }
      : undefined;

  return (
    <aside
      data-sidebar="operator"
      data-collapsed={iconsOnly ? "true" : "false"}
      className={cn(
        "z-40 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        variant === "drawer"
          ? "h-full w-56"
          : cn("fixed inset-y-0 left-0", iconsOnly ? "w-14" : "w-56")
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          iconsOnly ? "justify-center px-1" : "gap-2 px-4"
        )}
      >
        <BrandMark />
        {!iconsOnly ? (
          <span className="truncate text-sm font-semibold tracking-tight">
            {brand.brand_name}
          </span>
        ) : null}
      </div>
      <nav className={cn("flex-1 overflow-y-auto py-3", iconsOnly ? "px-1.5" : "px-2")}>
          <ul className={cn("flex flex-col", iconsOnly ? "items-center gap-1" : "gap-1")}>
            {navEntries.map((entry) => {
              if (isGroup(entry)) {
                const isExpanded = expanded[entry.label];
                const childActive = entry.children.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href + "/")
                );
                return (
                  <li key={entry.label}>
                    <button
                        type="button"
                        onClick={() => toggleGroup(entry.label)}
                        className={itemClass(childActive)}
                        aria-label={entry.label}
                        title={iconsOnly ? entry.label : undefined}
                      >
                        <entry.icon className="h-4 w-4" aria-hidden="true" />
                        {!iconsOnly ? (
                          <>
                            <span className="flex-1 text-left">{entry.label}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "rotate-180"
                              )}
                              aria-hidden="true"
                            />
                          </>
                        ) : null}
                      </button>
                    {isExpanded && !iconsOnly && (
                      <ul className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
                        {entry.children.map((child) => {
                          const isActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/");
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                                  isActive
                                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                )}
                                style={activeStyle(isActive)}
                              >
                                <child.icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const isActive =
                pathname === entry.href ||
                (entry.href !== "/dashboard" &&
                  pathname.startsWith(entry.href + "/")) ||
                (entry.href === "/dashboard" && pathname === "/dashboard");
              return (
                <li key={entry.href}>
                  <Link
                      href={entry.href}
                      aria-label={entry.label}
                      title={iconsOnly ? entry.label : undefined}
                      className={itemClass(isActive)}
                      style={activeStyle(isActive)}
                    >
                      <entry.icon className="h-4 w-4" aria-hidden="true" />
                      {!iconsOnly ? entry.label : null}
                    </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      {variant === "rail" ? (
        <div
          className={cn(
            "border-t border-sidebar-border",
            iconsOnly ? "flex flex-col items-center gap-1 px-1 py-2" : "px-2 py-2"
          )}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center rounded-md text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              iconsOnly ? "h-9 w-9 justify-center" : "w-full gap-2 px-3 py-2"
            )}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
            {!iconsOnly ? <span>Collapse</span> : null}
          </button>
          {!iconsOnly ? (
            <p className="px-2 pb-1 text-xs text-sidebar-foreground/50">
              {brand.brand_name} v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.7.141"}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-xs text-sidebar-foreground/50">
            {brand.brand_name} v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.7.141"}
          </p>
        </div>
      )}
    </aside>
  );
}
