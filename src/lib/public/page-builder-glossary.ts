/**
 * Locked Page Builder nomenclature (Stephen 2026-09-14).
 * Slot → Cell. Tabulated for Glossary seed + statefold.
 */

export const GLOSSARY_SEED_USER_ID = "user-coa";
export const GLOSSARY_SEED_AT = "2026-09-14T19:00:00.000Z";

export type GlossaryAudit = {
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by: string;
};

export const PAGE_BUILDER_GLOSSARY_SECTION = {
  id: "page-builder",
  name: "Page Builder",
  description:
    "Visitor canvas composition. Staff tabs: Branding, Canvas, Menu, Sky Animation. Canvas sub-tabs: Configuration, Elements, Rendering Drivers.",
};

export type PageBuilderGlossaryRow = {
  id: string;
  name: string;
  definition: string;
};

/** Seed table — keep in lockstep with docs/production/state/state_page_builder.md § Nomenclature. */
export const PAGE_BUILDER_GLOSSARY_ENTRIES: PageBuilderGlossaryRow[] = [
  {
    id: "e-pb-page",
    name: "Page",
    definition:
      "The visitor URL. The Primary Page is Home (/). Custom Pages are /p/{slug}. A Page is not a layout unit.",
  },
  {
    id: "e-pb-appearance",
    name: "Appearance",
    definition:
      "Settings tab for the staff theme (Light, Dusk, Slate, Dark, Architect). The choice is remembered on this device. Not a Page Builder tab.",
  },
  {
    id: "e-pb-branding",
    name: "Branding",
    definition:
      "Page Builder tab for name, color, logo, and Headline. Headline is the visitor footer title. Sub-tabs: Brand, Logo, and Cycle Strip. Cycle Strip is the six homepage steps (number, label, description, on/off). It is branded chrome, not a record type.",
  },
  {
    id: "e-pb-sky-animation",
    name: "Sky Animation",
    definition:
      "Last Page Builder tab, after Menu. Visitor sky (variant, zoom, density, effects). The sky stays on the first render; it does not reseed when the visitor changes pages.",
  },
  {
    id: "e-pb-menu",
    name: "Menu",
    definition:
      "Page Builder tab for Operator sidebar items and Public header/footer links. Off hides the item and disables its route. Settings stays on.",
  },
  {
    id: "e-pb-canvas",
    name: "Canvas",
    definition:
      "The editable surface of one Page, and a Page Builder tab. Under Canvas: Configuration (compose), Elements (pairings listing), Rendering Drivers. Primary Canvas is Home (/). Extra canvases are /p/{slug}.",
  },
  {
    id: "e-pb-configuration",
    name: "Configuration",
    definition:
      "Page Builder → Canvas → Configuration. Compose Primary and custom canvases: Rows, Cells, labels, slugs, anchors. Not the Elements listing and not Organization → Configuration.",
  },
  {
    id: "e-pb-elements",
    name: "Elements",
    definition:
      "Page Builder → Canvas → Elements. Listing of driver pairings (this record × this recipe). Distinct from an Element, which is the pairing bound on a Cell.",
  },
  {
    id: "e-pb-row",
    name: "Row",
    definition:
      "A full-width band on a Canvas, and one viewport on the visitor Page so the next control sits at the bottom of the screen. Columns are 1 through 8. An empty column’s X removes that column and lowers the count by one. A Row does not bind content. Builder drag sets display height on this screen only. Visitor height is separate.",
  },
  {
    id: "e-pb-cell",
    name: "Cell",
    definition:
      "One cell inside a Row. Count equals the Row’s column setting. A Cell is the drop target. The bound Element paints inside the Cell. Off hides that Cell on the visitor Page.",
  },
  {
    id: "e-pb-element",
    name: "Element",
    definition:
      "Record selection for one Rendering Driver — which records to paint, plus input map and optional filter. Not a driver attribute. Listed under Page Builder → Canvas → Elements. A Cell stores the pairing id and paints that Element.",
  },
  {
    id: "e-pb-element-type",
    name: "Element type",
    definition:
      "A Records Editor type a driver can paint. The driver chooses the type. Staff refine which rows of that type on the Element.",
  },
  {
    id: "e-pb-element-record",
    name: "Element record",
    definition:
      "One row of an Element type — one Page, one Statistics header, one inspection type. Not a page_element seed chip. Cycle Strip is not an Element record.",
  },
  {
    id: "e-pb-palette",
    name: "Palette",
    definition:
      "Empty-Cell Plus on Canvas → Configuration. The dialog lists Element records only (icon, Record type, Name). The Cell binds that Element as saved. Record type stays on the Rendering Driver.",
  },
  {
    id: "e-pb-menu-item",
    name: "Menu item",
    definition:
      "A Public-nav label that points at a Row or an Element. A Menu item is not a builder layout unit.",
  },
  {
    id: "e-pb-hero",
    name: "Hero",
    definition:
      "Locked first Row on the Primary Canvas. It cannot be reordered or removed. It can be turned On or Off.",
  },
  {
    id: "e-pb-visibility",
    name: "Visibility",
    definition:
      "On / Off toggle on every Canvas Row and every Cell (including Hero). Off hides that Row or Cell on the visitor Page.",
  },
  {
    id: "e-pb-driver",
    name: "Driver",
    definition:
      "See Rendering Driver. Legacy name for the code renderer behind an Element.",
  },
  {
    id: "e-pb-code-key",
    name: "Code key",
    definition:
      "Stamped from the released catalog for that Shape + Record type pair (page-header, statistics-header). Staff do not invent or edit a key — it is locked on the form.",
  },
  {
    id: "e-pb-rendering-driver",
    name: "Rendering Driver",
    definition:
      "One released pairing of Shape + Record type. Extra paint styles are Render outputs on that driver. Code key, Shape, and Record type are owned by product code. Status Active is required for Canvas use.",
  },
  {
    id: "e-pb-driver-pairing",
    name: "Driver pairing",
    definition:
      "Record selection for one Driver: one record, a filter, or all records. Unique on that selection. Select the Elements row to publish the Spatial Twin on the zone rail (same slot as Statistics). Many Cells may point at that same Element.",
  },
  {
    id: "e-pb-driver-input",
    name: "Driver input",
    definition:
      "A named slot the renderer needs (title, body, lines). Mapped to a Record output in the pairing.",
  },
  {
    id: "e-pb-record-output",
    name: "Record output",
    definition:
      "A field or derived value on the header or line (name, body_html, line_count, count_by of a line attribute). Not a Render output.",
  },
  {
    id: "e-pb-render-output",
    name: "Render output",
    definition:
      "A named paint variant owned by a Rendering Driver. Statistics outputs are Grid 1, 2, 4, 8, and 12 (8 is 4 columns by 2 rows; 12 is 4 by 3). The Cell stores the grid, the page to show, and whether pagination is on. The date under each graph is that period’s start. Not the same as Row columns.",
  },
  {
    id: "e-pb-spatial-twin",
    name: "Spatial Twin",
    definition:
      "The zone listing rail (desktop) and FloatTwinDock (phone). Select a record — Statistics or an Element — and the listing publishes TwinPreview into that one SpatialTwinPane. Do not mount a second pane inside the expanded row. Canvas Cells paint the Element in place. Configuration has no twin rail.",
  },
  {
    id: "e-pb-visitor-height",
    name: "Visitor height",
    definition:
      "Pixels or a viewport percent on a Row, chosen with Use. The visitor Row is always one viewport tall (the ceiling) so the next control stays at the bottom. A pixel value taller than that screen is cut down to it. A viewport percent is a share of the screen and is not cut again. Default pixels 240 (range 140–900). Default percent 40 (range 10–100). Builder drag does not change this.",
  },
  {
    id: "e-pb-element-configuration",
    name: "Element configuration",
    definition:
      "Collapsible bar under a Canvas Row. Holds each Cell’s binding, including Render output and, for Statistics, Grid, Page, and Pagination on display. Starts collapsed. Space stays under the bar when it is open or closed.",
  },
  {
    id: "e-pb-ui-components",
    name: "UI Components",
    definition:
      "Glossary tab after Org Board. The component gallery. /ui-components opens Glossary → UI Components.",
  },
];

export function withGlossaryAudit<T extends object>(
  row: T,
  stamp = GLOSSARY_SEED_AT,
  userId = GLOSSARY_SEED_USER_ID,
): T & GlossaryAudit {
  return {
    ...row,
    created_at: stamp,
    updated_at: stamp,
    created_by: userId,
    last_modified_by: userId,
  };
}

export const GLOSSARY_USER_LABELS: Record<string, string> = {
  "user-coa": "COA",
  "user-1": "Administrator",
};

export function formatGlossaryUser(id: string): string {
  return GLOSSARY_USER_LABELS[id] || id;
}

export function formatGlossaryDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
