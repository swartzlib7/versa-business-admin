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
    "Visitor canvas composition. Locked names: Page, Canvas, Row, Cell, Element, Palette.",
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
    id: "e-pb-canvas",
    name: "Canvas",
    definition:
      "The editable surface of one Page. One builder tab equals one Canvas. Staff compose Rows on a Canvas.",
  },
  {
    id: "e-pb-row",
    name: "Row",
    definition:
      "A full-width horizontal band on a Canvas. The Row owns the 1 / 2 / 4 / 6 / 8 column rotation, the content-width slider, and the Cell paint height (default 240px). A Row is only a layout container — it does not bind content itself.",
  },
  {
    id: "e-pb-cell",
    name: "Cell",
    definition:
      "One cell inside a Row. Count equals the Row’s column setting. A Cell is the drop target. The bound Element paints inside the Cell. Click a Cell to show its visual in the Spatial Twin. Off hides that Cell on the visitor Page.",
  },
  {
    id: "e-pb-element",
    name: "Element",
    definition:
      "A bound pairing on a Cell: an Element record plus a Rendering Driver. Staff drop an Element type from the Palette, then configure the record and driver. Listed under Page Builder → Elements.",
  },
  {
    id: "e-pb-element-type",
    name: "Element type",
    definition:
      "A record type that can live on a Canvas. Edited in its zone listing. Shown as a Palette chip (Page, Statistics, Cycle Strip, Inspections & Reports).",
  },
  {
    id: "e-pb-element-record",
    name: "Element record",
    definition:
      "One row of an Element type — one Page, one Statistics header, one Cycle Strip step, one inspection type. Not a page_element seed chip.",
  },
  {
    id: "e-pb-palette",
    name: "Palette",
    definition:
      "The tray of Element types staff drop onto Cells. Drop opens a configuration wizard. Glossary and Org Board stay Public menu routes, not Palette chips.",
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
    id: "e-pb-rendering-driver",
    name: "Rendering Driver",
    definition:
      "A record that describes a code renderer (code_key, bind shape, inputs, Render outputs, filter/pagination). Seeded from the code registry. Staff rename and describe; they do not invent a code_key. Changing a driver means walking docs/coa/DRIVER_TOUCHPOINTS.md.",
  },
  {
    id: "e-pb-driver-pairing",
    name: "Driver pairing",
    definition:
      "Unique bridge: one Element record × one Rendering Driver, plus the input map and optional filter/page. Many Cells may reuse the same pairing. Unique on (target type, target id, driver).",
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
      "A named paint variant owned by a Rendering Driver. Statistics (stat-graph) outputs are the 1 / 2 / 4 / 8 / 12 grids. The Spatial Twin pager switches outputs; the chosen output is stored on the Cell.",
  },
  {
    id: "e-pb-spatial-twin",
    name: "Spatial Twin",
    definition:
      "The live visual for the selected record or Cell. On a zone it sits in the right rail. On Page Builder → Canvas, clicking a Cell opens the same twin so staff can see and switch that Element’s Render outputs.",
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
