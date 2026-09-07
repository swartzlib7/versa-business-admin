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

/** Dispatched after Settings → Menu saves order or enabled items. */
export const MENU_ORDER_EVENT = "mc-menu-order";

/** Operator href that cannot be turned off (otherwise the controls are unreachable). */
export const LOCKED_OPERATOR_HREFS = ["/settings"];

export type PublicNavItem = {
  href: string;
  label: string;
  /** Only shown on the visitor site when Demo mode is on. */
  demoOnly?: boolean;
};

/** Default visitor header/footer links. Settings → Menu → Public can reorder and toggle. */
export const DEFAULT_PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  { href: "/#integrations", label: "Integrations" },
  { href: "/#operations", label: "Operations" },
  { href: "/#metrics", label: "Metrics" },
  { href: "/#knowledge", label: "Knowledge" },
  { href: "/#contact", label: "Contact" },
  { href: "/terms", label: "Glossary" },
  { href: "/board", label: "Org Board" },
  { href: "/#facets", label: "Facets", demoOnly: true },
  { href: "/#systems", label: "Systems", demoOnly: true },
  { href: "/#support", label: "Support", demoOnly: true },
  { href: "/#about", label: "About", demoOnly: true },
];

export function defaultPublicNavHrefs(): string[] {
  return DEFAULT_PUBLIC_NAV_ITEMS.map((item) => item.href);
}

/**
 * Deep operator routes owned by a sidebar item. Turning the item off also
 * blocks these URLs (Stephen 2026-09-07: hidden menu ⇒ route disabled).
 */
const OPERATOR_PATH_OWNERS: { prefix: string; href: string }[] = [
  { prefix: "/records-editor", href: "/records-editor" },
  { prefix: "/ui-components", href: "/ui-components" },
  { prefix: "/organization", href: "/organization" },
  { prefix: "/collaboration", href: "/collaboration" },
  { prefix: "/environment", href: "/environment" },
  { prefix: "/integrations", href: "/collaboration" },
  { prefix: "/dashboard", href: "/dashboard" },
  { prefix: "/glossary", href: "/glossary" },
  { prefix: "/settings", href: "/settings" },
  { prefix: "/contact", href: "/contact" },
  { prefix: "/projects", href: "/organization" },
  { prefix: "/products", href: "/organization" },
  { prefix: "/agents", href: "/organization" },
  { prefix: "/users", href: "/users" },
  { prefix: "/stats", href: "/stats" },
  { prefix: "/tasks", href: "/organization" },
];

export function operatorHrefForPath(pathname: string): string | null {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const match = OPERATOR_PATH_OWNERS.filter(
    (row) => path === row.prefix || path.startsWith(`${row.prefix}/`),
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match?.href ?? null;
}

export function isOperatorPathEnabled(pathname: string, enabled: string[]): boolean {
  const href = operatorHrefForPath(pathname);
  if (!href) return true;
  return enabled.includes(href);
}

export function publicSectionId(href: string): string | null {
  return href.startsWith("/#") ? href.slice(2) : null;
}

export function isPublicHrefEnabled(
  href: string,
  enabled: string[],
  demo: boolean,
): boolean {
  const item = DEFAULT_PUBLIC_NAV_ITEMS.find((row) => row.href === href);
  if (!item) return enabled.includes(href);
  if (item.demoOnly && !demo) return false;
  return enabled.includes(href);
}

export function visiblePublicNavItems(opts: {
  demo: boolean;
  enabled: string[];
  order?: string[] | null;
}): PublicNavItem[] {
  const ordered = orderNavItems(DEFAULT_PUBLIC_NAV_ITEMS, opts.order);
  return ordered.filter((item) => isPublicHrefEnabled(item.href, opts.enabled, opts.demo));
}

export function visiblePublicSectionIds(opts: {
  demo: boolean;
  enabled: string[];
  order?: string[] | null;
}): string[] {
  const ids: string[] = [];
  for (const item of visiblePublicNavItems(opts)) {
    const id = publicSectionId(item.href);
    if (id) ids.push(id);
  }
  return ids;
}

export function nextPublicSectionId(currentId: string, visibleIds: string[]): string | undefined {
  const i = visibleIds.indexOf(currentId);
  if (i < 0 || i >= visibleIds.length - 1) return undefined;
  return visibleIds[i + 1];
}

/**
 * Enabled href list. `undefined` / missing → all allowed items on.
 * Explicit array (including empty) → only those hrefs, plus locked-on items.
 */
export function sanitizeMenuEnabled(
  enabled: unknown,
  allowed: string[],
  lockedOn: string[] = [],
): string[] {
  const allowedSet = new Set(allowed);
  const locked = lockedOn.filter((href) => allowedSet.has(href));
  if (!Array.isArray(enabled)) return [...allowed];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const href of enabled) {
    if (typeof href !== "string" || !allowedSet.has(href) || seen.has(href)) continue;
    out.push(href);
    seen.add(href);
  }
  for (const href of locked) {
    if (!seen.has(href)) {
      out.push(href);
      seen.add(href);
    }
  }
  return out;
}

export function publicFlagsFromEnabled(enabled: string[]): {
  glossary_in_menu: boolean;
  org_board_enabled: boolean;
} {
  return {
    glossary_in_menu: enabled.includes("/terms"),
    org_board_enabled: enabled.includes("/board"),
  };
}

export function withToggledHref(enabled: string[], href: string, on: boolean, lockedOn: string[] = []): string[] {
  const locked = new Set(lockedOn);
  if (locked.has(href) && !on) return enabled;
  const set = new Set(enabled);
  if (on) set.add(href);
  else set.delete(href);
  for (const keep of locked) set.add(keep);
  return [...set];
}

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

export function sanitizeMenuOrder(order: unknown, allowedHrefs?: string[]): string[] | null {
  if (!Array.isArray(order)) return null;
  const allowed = new Set(allowedHrefs ?? defaultNavHrefs());
  const seen = new Set<string>();
  const out: string[] = [];
  for (const href of order) {
    if (typeof href !== "string" || !allowed.has(href) || seen.has(href)) continue;
    out.push(href);
    seen.add(href);
  }
  return out.length ? out : null;
}
