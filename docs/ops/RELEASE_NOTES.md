# Versa - Business Admin — Release notes

**Product:** Versa - Business Admin (VBA)  
**Current:** 1.0.2 (2026-09-23)

Health check: `GET /api/health` returns this version from `package.json`.

## 1.0.2

Page Builder can ship a visitor site from three drivers, and Demo mode installs that site for you.

### Page Builder

Tabs, left to right: **Appearance**, **Branding**, **Menu**, **Canvas**, **Sky Animation**.

Under Canvas: **Configuration**, **Elements**, **Rendering Drivers**. The component gallery moved to **Glossary**, after Org Board. `/ui-components` opens that tab.

Three drivers are pairable:

| Driver | What a Cell can paint |
|--------|------------------------|
| **HTML Page** | **HTML block** (the body) or **Record card** (title plus body) |
| **Statistics** | A graph grid (1, 2, 4, 8, or 12). Grid 8 is four columns by two rows. Page and pagination sit on the Cell. The date under a graph is that period’s start. |
| **Location** | **Location Card**, or **Location with Map**. The choice is stored on the Cell, so one Element can be a card in one Cell and a map in another. |

Pages are edited with a visual editor (headings, marks, lists, quote, link) or as HTML source. The record still stores `body_html`.

A visitor row is one screen tall so the next control stays at the bottom. Staff set that height in pixels or as a viewport percent. Dragging a row in the builder only changes how tall it looks there. Element configuration under a row starts collapsed. Rows can be collapsed and reordered; that collapsed state is saved with the canvas. A new row starts collapsed. The last visible row has no bottom arrow and no line under it.

Custom canvases use the same cell controls as Primary, including the delete **X** once a row has more than one column.

### Demo with Sample data

Settings → Modes. One switch.

**On** installs the sample pack and binds it:

- Primary canvas: Facets, Integrations, Inspections & Reports, and Knowledge as HTML pages; Statistics as a four-graph cell; Contacts as a location with a map.
- Overview (`/p/overview`): About as an HTML block and a record card, then a location card beside one statistics graph.
- Both canvases are **75%** wide with a **48px** margin.
- HTML pages use a different accent on each section (teal, amber, sky, violet, emerald).
- Inspections & Reports includes the customer support ticket table (TKT-001 through TKT-004) with priority and status chips.
- The statistics record has six monthly values: 8, 12, 15, 18, 22, 27.

**Off** deletes the sample pack, including Sample Customer, and leaves one empty row on Primary and one on Overview. The Primary Org, Administrator, and COA accounts stay. Rendering Drivers stay.

### Not in this release

Integrations still have no visitor driver (DM-02). Inspection tickets are shown as HTML, not as a live ticket listing. AUTH-01 and the held statistics-twin layout item (**B**) are unchanged.

## 1.0.1

First Page Builder cut on the RenderDriver line: paint from an Element (`pairingId`), one driver per Shape and record type, and the Statistics-style Spatial Twin on Elements.
