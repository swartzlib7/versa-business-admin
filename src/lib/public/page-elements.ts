/**
 * Page Builder Element catalog — system seed + tenant records.
 * Environment → Knowledge → Elements. Feeds the Palette.
 */

export const PAGE_ELEMENT_TYPE = "page_element";

export type PageElementKind = "feature" | "record" | "home";

export type PageElementDef = {
  id: string;
  name: string;
  driver: string;
  kind: PageElementKind;
  recordType?: string;
  featureId?: string;
  description: string;
  preview: string;
};

/** System seed of rendering drivers. Tenant Element records can extend or relabel. */
export const PAGE_ELEMENT_SEED: PageElementDef[] = [
  {
    id: "pe-cycle-strip",
    name: "Cycle Strip",
    driver: "cycle-strip",
    kind: "feature",
    featureId: "cycle-strip",
    description: "Public cycle steps shared with the Hero strip.",
    preview: "Numbered cycle steps in a horizontal strip.",
  },
  {
    id: "pe-glossary",
    name: "Glossary of Terms",
    driver: "glossary-book",
    kind: "feature",
    featureId: "glossary",
    description: "Public glossary book.",
    preview: "Section navigator + term definitions.",
  },
  {
    id: "pe-org-board",
    name: "Org Board",
    driver: "org-board",
    kind: "feature",
    featureId: "org-board",
    description: "Public organizing board.",
    preview: "Division chart with department names.",
  },
  {
    id: "pe-statistics",
    name: "Statistics",
    driver: "stat-graph",
    kind: "record",
    recordType: "statistics",
    description: "Binds one or more Statistics headers to a Cell.",
    preview: "Spatial Twin stat-graph outputs: 1 / 2 / 4 / 8 / 12 up.",
  },
  {
    id: "pe-html-page",
    name: "Page",
    driver: "html-block",
    kind: "record",
    recordType: "page",
    description: "Visitor page. Body can render as Text or HTML.",
    preview: "Rendered HTML body.",
  },
  {
    id: "pe-inspections",
    name: "Inspections & Reports",
    driver: "home:inspections-reports",
    kind: "record",
    recordType: "inspection_report",
    description: "Support types as headers; tickets as lines.",
    preview: "Inspection / report cards.",
  },
  {
    id: "pe-facets",
    name: "Facets",
    driver: "home:facets",
    kind: "home",
    featureId: "home:facets",
    description: "Primary Canvas homepage Facets row.",
    preview: "HTML Facets block when a public_html record is bound.",
  },
  {
    id: "pe-integrations",
    name: "Integrations",
    driver: "home:integrations",
    kind: "home",
    featureId: "home:integrations",
    description: "Primary Canvas Integrations row. Paints when a spatial twin exists.",
    preview: "Vendor integration cards (twin pending until present).",
  },
  {
    id: "pe-metrics",
    name: "Statistics",
    driver: "home:statistics",
    kind: "home",
    featureId: "home:statistics",
    description: "Primary Canvas Statistics row.",
    preview: "Environment statistic cards.",
  },
  {
    id: "pe-knowledge",
    name: "Knowledge",
    driver: "home:knowledge",
    kind: "home",
    featureId: "home:knowledge",
    description: "Primary Canvas Knowledge row.",
    preview: "Knowledge article cards.",
  },
  {
    id: "pe-about",
    name: "About",
    driver: "home:about",
    kind: "home",
    featureId: "home:about",
    description: "Primary Canvas About row.",
    preview: "HTML About block.",
  },
  {
    id: "pe-contact",
    name: "Contacts",
    driver: "home:contacts",
    kind: "home",
    featureId: "home:contacts",
    description: "Primary Canvas Contacts row — Location or Contact plus Organization.",
    preview: "Email, phone, and address from the record chain.",
  },
];

export type PaletteItem = {
  id: string;
  label: string;
  kind: PageElementKind;
  driver: string;
  featureId?: string;
  recordType?: string;
  description?: string;
  preview?: string;
};

export function seedToPalette(rows: PageElementDef[] = PAGE_ELEMENT_SEED): PaletteItem[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.name,
    kind: row.kind,
    driver: row.driver,
    featureId: row.featureId,
    recordType: row.recordType,
    description: row.description,
    preview: row.preview,
  }));
}

export function recordsToPalette(
  records: Array<{ id: string; name: string; status?: string; data?: Record<string, string> }>,
): PaletteItem[] {
  const byDriver = new Map<string, PaletteItem>();
  for (const seed of seedToPalette()) {
    byDriver.set(seed.driver, seed);
  }
  for (const rec of records) {
    if (rec.status && rec.status !== "active") continue;
    const data = rec.data ?? {};
    const driver = (data.driver || "").trim();
    if (!driver) continue;
    const kind = (data.kind === "record" || data.kind === "home" ? data.kind : "feature") as PageElementKind;
    byDriver.set(driver, {
      id: rec.id,
      label: rec.name || data.name || driver,
      kind,
      driver,
      featureId: data.feature_id || undefined,
      recordType: data.record_type || undefined,
      description: data.description,
      preview: data.preview,
    });
  }
  return [...byDriver.values()];
}

export function paletteForDrop(items: PaletteItem[]): PaletteItem[] {
  return items.filter((row) => row.kind === "feature" || row.kind === "record");
}

export function paletteForHomeAdd(items: PaletteItem[]): PaletteItem[] {
  return items.filter((row) => row.kind === "home");
}
