/**
 * Fold retired technical names onto chrome labels.
 * Structure (menus / tab order) does not change — only ids.
 * Record-type **ids** (`rt-environment_stat`, …) stay for FK stability.
 */

/** System record-type api_name (and object_api_name). */
export const RECORD_TYPE_ALIASES: Record<string, string> = {
  environment_stat: "statistics",
  public_html: "page",
  communication_report: "inspection_report",
};

/** Zone baked-child tab ids. */
export const TAB_ID_ALIASES: Record<string, string> = {
  stats: "statistics",
};

/** Primary-canvas / public hash ids (href `/#${id}`). */
export const HOME_SECTION_ALIASES: Record<string, string> = {
  metrics: "statistics",
  support: "inspections-reports",
  contact: "contacts",
};

/** Legacy home:* and leftover driver ids. */
export const DRIVER_ALIASES: Record<string, string> = {
  "home:metrics": "home:statistics",
  "home:support": "home:inspections-reports",
  "home:contact": "home:contacts",
};

export const PUBLIC_HREF_ALIASES: Record<string, string> = {
  "/#metrics": "/#statistics",
  "/#support": "/#inspections-reports",
  "/#contact": "/#contacts",
};

function fold(map: Record<string, string>, value: string | undefined | null): string {
  if (!value) return value ?? "";
  return map[value] ?? value;
}

export function foldRecordTypeApiName(value: string | undefined | null): string {
  return fold(RECORD_TYPE_ALIASES, value);
}

export function foldTabId(value: string | undefined | null): string {
  return fold(TAB_ID_ALIASES, value);
}

export function foldHomeSectionId(value: string | undefined | null): string {
  return fold(HOME_SECTION_ALIASES, value);
}

export function foldDriverId(value: string | undefined | null): string {
  return fold(DRIVER_ALIASES, value);
}

export function foldPublicHref(value: string | undefined | null): string {
  return fold(PUBLIC_HREF_ALIASES, value);
}

export function foldPublicHrefs(hrefs: string[] | undefined | null): string[] {
  if (!hrefs) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const href of hrefs) {
    const next = foldPublicHref(href);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}
