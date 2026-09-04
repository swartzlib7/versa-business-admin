import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  Handshake,
  Globe2,
  BookOpen,
  Database,
  Palette,
  Mail,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Dispatched after Settings → System → Menu saves a new order. */
export const MENU_ORDER_EVENT = "mc-menu-order";

/** Default sidebar order. Settings → System → Menu can reorder by href. */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organization", label: "Organization", icon: Building2 },
  { href: "/collaboration", label: "Collaboration", icon: Handshake },
  { href: "/environment", label: "Environment", icon: Globe2 },
  { href: "/glossary", label: "Glossary", icon: BookOpen },
  { href: "/users", label: "Users", icon: Users },
  { href: "/records-editor", label: "Records Editor", icon: Database },
  { href: "/ui-components", label: "UI Components", icon: Palette },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/contact", label: "Contacts", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function defaultNavHrefs(): string[] {
  return DEFAULT_NAV_ITEMS.map((item) => item.href);
}

/** Apply a stored href order. Unknown hrefs are ignored; missing items stay at the end. */
export function orderNavItems<T extends { href: string }>(
  items: T[],
  order?: string[] | null,
): T[] {
  if (!order?.length) return items;
  const byHref = new Map(items.map((item) => [item.href, item]));
  const seen = new Set<string>();
  const out: T[] = [];
  for (const href of order) {
    const item = byHref.get(href);
    if (item && !seen.has(href)) {
      out.push(item);
      seen.add(href);
    }
  }
  for (const item of items) {
    if (!seen.has(item.href)) out.push(item);
  }
  return out;
}

export function sanitizeMenuOrder(order: unknown): string[] | null {
  if (!Array.isArray(order)) return null;
  const allowed = new Set(defaultNavHrefs());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const href of order) {
    if (typeof href !== "string" || !allowed.has(href) || seen.has(href)) continue;
    out.push(href);
    seen.add(href);
  }
  return out.length ? out : null;
}
