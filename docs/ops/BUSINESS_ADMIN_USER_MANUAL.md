# Versa - Business Admin — User Manual

**Product:** Versa - Business Admin (VBA)  
**Audience:** Staff who **use** VBA after it is installed — Administrators and members working in Records, Organization, Environment, Statistics, Settings, and the public site.  
**Status:** §7 Page Builder chrome is written. Sections 1–6 stay planned.  
**Ops (install / configure / maintain / enhance):** [`BUSINESS_ADMIN_OPS_MANUAL.md`](BUSINESS_ADMIN_OPS_MANUAL.md)  
**Implement / enhance (forms, listings, twin, deploy):** [`WORKING_WITH_VBA.md`](WORKING_WITH_VBA.md)

This file is the staff how-to. It is **not** the Versa AGi agent/operator Ops Manual.

Agents and operators who install or upgrade VBA stay in the Ops Manual and the host skill `business_admin`.

Terms in this chapter match Glossary → **Page Builder**.

## Planned sections (TBD)

1. Sign in and roles (Admin vs member) — link out to Ops §1.5 for the operator detail  
2. Operator chrome (zones, listings, Records Editor)  
3. Organization, Collaboration, Environment  
4. Statistics (header, lines, graph)  
5. Settings (Modes, Appearance, E-Mail Delivery, API). Appearance is your staff theme on this device  
6. Public homepage (as a visitor)

## 7. Page Builder

Sidebar → **Page Builder** (`/page-builder`). Site chrome that used to sit under Settings lives here.

### Tabs (left to right)

| Tab | What you do |
|-----|-------------|
| **Branding** | Name, color, logo, Headline (Brand / Logo / Cycle Strip). Headline is the visitor footer title. Cycle Strip is the six homepage steps (number, label, description, on/off). It is not a record |
| **Canvas** | Compose visitor pages, list pairings, and list Rendering Drivers |
| **Menu** | **Operator** sidebar items, or **Public** header/footer links. Off hides the item and turns the route off. Settings stays on |
| **Sky Animation** | Visitor sky. It stays as first rendered until a full page refresh |

### Canvas

| Sub-tab | What you do |
|---------|-------------|
| **Configuration** | Primary Canvas URL is `/` (slug locked). Its Label is editable and paints on the visitor Home link. Extra canvases are `/p/{slug}`. Plus on an empty Cell lists Element records (icon, Record type, Name) and binds one. **+ Add row** starts Off named `__blank__` — rename it before you can turn it On. Remove uses the same confirm as listings. Columns are 1 through 8. The toggle will not drop a column that already has an Element. X on an empty column removes it and lowers the count by one |
| **Elements** | Record selection for a driver. Do not delete an Element while a Cell still uses it |
| **Rendering Drivers** | Marries a record type with a display. **Record type** is a lookup (Contacts is `location`). **Code key** and Shape are locked. Recipes live in product code. **Status** Active is required for Canvas use — confirm if pairings exist before leaving Active or changing Record type. ID is auto and sits at the bottom. No Primary Org |

HTML Page cells choose a render option. **HTML block** paints the body. **Record card** paints the page title and body inside a card.

The component gallery is **Glossary → UI Components**, the tab after Org Board. `/ui-components` opens that tab.

Pages and Statistics records stay **Environment → Custom**. Inspections & Reports stay **Faculty → Communications**. Contacts stay **Distribution → Contacts**. Page Builder binds and paints those records; it is not their listing home. Cycle Strip is edited under Branding, not as a Custom record.

### Row height

Each visitor Row is one screen tall so the next control sits at the bottom.

| Control | What it changes |
|---------|-----------------|
| **Builder** drag | Height of the Cells on the Page Builder screen only |
| **px** / **viewport %** / **Use** | Height of the Cells on the visitor Page |

Pixels taller than the screen are cut down to that screen. A viewport percent is a share of the screen and is not cut again. Those two choices will not match each other. That is expected.

**Element configuration** under the Row starts collapsed. It opens and closes, and stays spaced below the bar either way. Statistics Cells set Grid (1, 2, 4, 8, 12), Page, and Pagination on display. Grid 8 is four columns by two rows. The date under each graph is that period’s start.

When a Driver or Render output changes, update this chapter and Glossary → Page Builder.
