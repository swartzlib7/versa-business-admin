"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { useBrand, BrandMark } from "@/components/shell/brand-provider";
import { ChevronDown } from "lucide-react";
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

// I5.6.6 + board + I5.6.32 (Stephen 2026-07-22): zone menus own IA.
// Order is Settings → System → Menu (instance persist).

export function Sidebar() {
  const brand = useBrand();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);

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

  const navEntries: NavEntry[] = navItems;

  // Auto-expand group if a child route is active
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

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <BrandMark />
        <span className="text-sm font-semibold tracking-tight">
          {brand.brand_name}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-1">
          {navEntries.map((entry) => {
            if (isGroup(entry)) {
              const isExpanded = expanded[entry.label];
              const childActive = entry.children.some(
                (child) => pathname === child.href || pathname.startsWith(child.href + "/")
              );
              return (
                <li key={entry.label}>
                  <button
                    onClick={() => toggleGroup(entry.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                      childActive
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <entry.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {isExpanded && (
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
                              style={
                                isActive
                                  ? {
                                      boxShadow: `inset 3px 0 0 ${theme.colors.brand}`,
                                      backgroundColor: `${theme.colors.brand}22`,
                                      color: theme.colors.brand,
                                    }
                                  : undefined
                              }
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

            // Flat nav item
            const isActive =
              pathname === entry.href ||
              (entry.href !== "/dashboard" &&
                pathname.startsWith(entry.href + "/")) ||
              (entry.href === "/dashboard" && pathname === "/dashboard");
            return (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    isActive
                      ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  style={
                    isActive
                      ? {
                          boxShadow: `inset 3px 0 0 ${theme.colors.brand}`,
                          backgroundColor: `${theme.colors.brand}22`,
                          color: theme.colors.brand,
                        }
                      : undefined
                  }
                >
                  <entry.icon className="h-4 w-4" aria-hidden="true" />
                  {entry.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-sidebar-foreground/50">
          {brand.brand_name} v{process.env.NEXT_PUBLIC_APP_VERSION ?? '0.7.64'}
        </p>
      </div>
    </aside>
  );
}
