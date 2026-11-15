# Versa - Business Admin — User Manual

**Product:** Versa - Business Admin (VBA)  
**Audience:** Staff who **use** VBA after it is installed — Administrators and members working in Records, Organization, Environment, Statistics, Settings, and the public site.  
**Status:** §4 Statistics and §7 Page Builder are written. Sections 1–3, 5 and 6 stay planned.  
**Ops (install / configure / maintain / enhance):** [`BUSINESS_ADMIN_OPS_MANUAL.md`](BUSINESS_ADMIN_OPS_MANUAL.md)  
**Implement / enhance (forms, listings, twin, deploy):** [`WORKING_WITH_VBA.md`](WORKING_WITH_VBA.md)

This file is the staff how-to. It is **not** the Versa AGi agent/operator Ops Manual.

Agents and operators who install or upgrade VBA stay in the Ops Manual and the host skill `business_admin`.

Terms in this chapter match Glossary → **Page Builder**.

## Planned sections (TBD)

1. Sign in and roles (Admin vs member) — link out to Ops §1.5 for the operator detail  
2. Operator chrome (zones, listings, Records Editor)  
3. Organization, Collaboration, Environment  
4. Statistics — written below  
5. Settings (Modes, Appearance, E-Mail Delivery, API). Appearance is your staff theme on this device  
6. Public homepage (as a visitor)

## 4. Statistics

Sidebar → **Custom Records** → **Statistics**. A statistic is one thing you count over time, such as parts produced a day or letters out a week. Each statistic has one graph.

A statistic has two parts:

- **Header**: its settings (name, scale, frequency, target).
- **Values**: one number per step, such as one per day.

The header decides which steps exist. You only ever change the values.

### Make a statistic

Click **New Record**. The form has the same four sections as Edit.

| Section | Field | What it means |
|---------|-------|---------------|
| **Statistic** | **Name** | What you count |
| | **Series mode** | **Dynamic Series** starts a new period when the current one is full. **Single Series** keeps one period only |
| **Scale** | **Scale Name** | The unit, printed up the left side of the graph (optional) |
| | **Scale Low** / **Scale High** | The lowest and highest value you expect in one step. Values outside them are refused |
| | **Scale Division** | The gap between the numbers up the left side. Typing Scale High fills in a suggestion while this field is empty. Your own value is never replaced |
| **Frequency** | **Frequency type** | How often you count: Hour, Day, Week, Month, and so on |
| | **Frequency start** | Worked out from Start datetime and Frequency type. Read-only |
| | **Frequency quantity** | Steps in one period. Day × 7 is a week of days |
| | **Start datetime** | When the first step starts. It defaults to now |
| | **Period target** | The quota for one whole period, such as 98 parts a week (optional) |
| | **Target per Day** (or Week, Month…) | Period target ÷ Frequency quantity (98 ÷ 7 = 14). Read-only |
| **Audit** | **Created By** / **Last Modified By** | Filled in for you |

The Spatial Twin draws the graph while you fill in the form. Click **Add to table** to save. The first period's steps are created empty, ready for values.

### Open, view and edit

- **Click a row** to open it. Click it again to close it.
- **Edit** on the row (or in the open header) changes the header. **Cancel** leaves the row open.
- The **Graph** radio at the start of a row shows that statistic in the Spatial Twin without opening it.

### Enter values

Open the statistic. The values card under the header has two views. Switch with **Table** | **Enhanced UI** at the top of the card. VBA remembers your choice on this browser.

| View | How it works |
|------|--------------|
| **Table** | One row per step, with the step (e.g. Mon), its Stamp, and a **Value** box. Type in the box, then press **Enter** or click away to save. **Esc** undoes your typing. Filter, Columns and the column headings sort and filter as on every listing. **Add row** adds a step: pick it from the list and enter its value. The **trash** icon at the end of a row deletes that row, after you confirm |
| **Enhanced UI** | Every period in the table, one under the other, each headed with its dates (and Met, Short and Needed when a Period target is set). One box per step, labelled like the graph, with the step's date and time under it. **Enter** saves and moves to the next step, into the next period after the last step. The box with the colored outline is the next empty step. A **dashed** box is a step with no row (for example one you deleted): typing a value adds the row |

Every value box has **up and down arrows**:

- Click an arrow to go up or down one step.
- Hold an arrow to keep going.
- Press an arrow and drag up or down to change the number quickly.
- The Up and Down keys work too. Hold Shift to move ten at a time.

**0 and empty are different.** 0 is a value: it counts toward Met and is drawn at the bottom of the graph. An empty step is a gap: it is not drawn, and the catch-up pace starts after the last filled step.

To **clear** a value, click the **trash** icon at the top right of its box in Enhanced UI (only boxes with a value have one). In Table, empty the Value box and press Enter. The step stays, empty.

To **delete** a row (a step entered by mistake, or a period you do not want), use the trash icon on that row in **Table**. The step and its value are removed. Use **Add row** to put a step back.

In Enhanced UI, "Saved …" and any error (such as a value outside the scale) show in the card header, so the boxes never change size.

**Periods.** With **Dynamic Series**, filling the last step of a period opens the next period: Enhanced UI shows it as a new set of dashed boxes at the bottom. Values typed there belong to that next period, not the first one. With **Single Series**, there is one period only.

While you type in Enhanced UI, the Spatial Twin shows the period you are in and redraws as you type.

Values can also come from a script through the capture API. See the Ops Manual for the endpoint and sign-in.

### Read the graph

The Spatial Twin (right side; on a phone, the **Spatial twin** tab at the bottom) shows the statistic you picked.

| On the graph | Meaning |
|--------------|---------|
| Plain line and dots (text color) | Your values. A blank step leaves a gap |
| Blue line, **T** number | Target per step |
| Orange dashed line and circles | What each remaining step needs to reach the Period target. Shown on the period still being filled in. If it is above Scale High it stays at the top edge with its number |

Under one graph, four boxes show:

- **Quota**: the Period target.
- **Met**: the total so far. A blank step between filled steps counts as 0.
- **Short** (or **Over**): how far you are from the quota.
- **Needed**: the amount per step for the steps that are left.

**1 / 2 / 4 / 8 / 12** shows that many periods at once. **‹ ›** page through them. **Lightbox** opens the graph full screen.

The app draws the statistic; it does not judge it. Reading the trend is up to you.

Page Builder Statistics Cells draw the same graph on visitor pages (§7).

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

Pages and Statistics records stay **Custom Records** (sidebar, above Records Editor). Inspections & Reports stay **Faculty → Communications**. Contacts stay **Distribution → Contacts**. Page Builder binds and paints those records; it is not their listing home. Cycle Strip is edited under Branding, not as a Custom record.

### Row height

Each visitor Row is one screen tall so the next control sits at the bottom.

| Control | What it changes |
|---------|-----------------|
| **Builder** drag | Height of the Cells on the Page Builder screen only |
| **px** / **viewport %** / **Use** | Height of the Cells on the visitor Page |

Pixels taller than the screen are cut down to that screen. A viewport percent is a share of the screen and is not cut again. Those two choices will not match each other. That is expected.

**Element configuration** under the Row starts collapsed. It opens and closes, and stays spaced below the bar either way. Statistics Cells set Grid (1, 2, 4, 8, 12), Page, and Pagination on display. Grid 8 is four columns by two rows. The date under each graph is that period’s start.

When a Driver or Render output changes, update this chapter and Glossary → Page Builder.
