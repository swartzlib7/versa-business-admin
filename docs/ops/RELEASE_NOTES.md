# Versa - Business Admin — Release notes

**Product:** Versa - Business Admin (VBA)  
**Current:** 1.0.12 (2026-11-15)

Health check: `GET /api/health` returns this version from `package.json`.

## 1.0.12

No new migration, but still run `npm run db:migrate` before the new process serves traffic: it applies anything the install is missing, such as `0020` on an install below 1.0.9. Catalog seed pack is `1.0.12-r1`; the next start adds the Period target fields to Statistics. Upgrade steps are in the Ops Manual, section 5.2.9.

- A statistic can have a **Period target**: the quota for one period, such as 98 parts a week. It sits in the Frequency section. **Target per Day** (or Week, Month, …) is worked out from it and shown read-only.
- The graph draws the target as a blue line. On the period you are still filling in, an orange dashed line and dots show what each remaining step needs to reach the quota. A pace above Scale High stays at the top edge with its number printed, so the scale never changes.
- Under a single graph, the Spatial Twin and lightbox show **Quota**, **Met**, **Short** (or **Over**) and **Needed**. A blank step between filled steps counts as 0 toward Met.
- Page Builder Statistics Cells draw the same target line and pace.
- Typing Scale High fills in a suggested Scale Division while that field is empty. Your own value is never replaced.
- A statistic's values are edited in place. In the **Table** view, type in the Value cell and press Enter (or click away). There is no Edit form, no Update row, and no Delete on a value row, because the statistic's settings decide which rows exist. Empty a value to clear it.
- New **Enhanced UI** view for a statistic's values, next to **Table** on the values card: one cell per step for one period. Enter saves and moves to the next step, and a full period opens the next one. The Spatial Twin redraws as you type. Your choice of view is remembered.
- In Enhanced UI, each box with a value has a trash icon at the top right. It clears the value, leaving a gap on the graph. 0 is a value and is drawn as 0. "Saved" and error messages show in the card header, so the boxes keep their size.
- Value boxes have up and down arrows. Click for one step, hold to keep going, or press and drag up or down to change the number quickly. Arrow keys work too (Shift for ten at a time).
- **New Record** for a statistic (and the other header-and-lines types) shows the same sections as Edit, instead of one long list of fields.
- Fixed: on a Dynamic Series statistic, New Record put a value into a new period instead of the empty step you picked.
- Fixed: a browser warning about a repeated key when a statistic was open.
- Fixed: on the public homepage, the top of the logo was hidden under the header on shorter screens (for example a laptop or a browser that is not full height). The hero now starts below the header, the logo shrinks to fit a short screen, and on phones the headline wraps instead of running off both sides.
- Fixed: a statistic created or updated through the record API (`POST /api/records`, `PATCH /api/records/<id>`) was stored without Frequency start and Target per step. The API now fills them in the same way the screen does.
- Fixed: on a new install, `node scripts/seed.mjs` finished with an error about a missing `tasks` table. Tasks are Project task lines since 1.0.9; the summary now counts those.
- The User Manual has a Statistics chapter (§4).
- Fixed: a new statistic shows its live graph in the Spatial Twin again while you fill it in.
- Fixed: Start datetime and the date under the graph read like `31 Dec 2025 @ 19:00:00` instead of `2025-12-31T19:00`.
- Fixed: the graph fills the Spatial Twin better, and the last date label under it is no longer cut off.
- Fixed: on a phone, an open record fits the screen instead of running off the right edge.
- Fixed: the tab description shows once at the top, not again inside an open record, and an empty table no longer reads "No yet".

## 1.0.11

Bug fix. No new migration. Catalog seed pack stays `1.0.10-r1`. Upgrade steps are in the Ops Manual, section 5.2.8.

- The Spatial Twin is back on Custom Records → Statistics. Click a statistic’s row or its Graph button to see its graph. The panel had been missing there since Statistics moved to Custom Records in 1.0.7. Your statistics and their lines were not affected.

## 1.0.10

No new migration. Catalog seed pack is `1.0.10-r1`; the next start adds the Hats record type. Upgrade steps are in the Ops Manual, section 5.2.7.

- Executive has a Hats tab next to Projects. A hat holds the purposes, know-how, and duties of a post, the Staff who hold it, and up to 10 images.
- Purposes, Know-How, and Duties are numbered lists. Add, edit, remove, and drag entries into order.
- Records Editor has two new field types: Text list and Multi-lookup (link to several records).
- Every image in a gallery can carry a description.
- Pick a hat with its row button to see the write-up in the Spatial Twin. Images sit on their own page in a grid that grows with the count, up to 5 rows of 2.
- The Spatial Twin has a Print button for Hats and Project Gantts. It opens a print-ready page and the print dialog.

## 1.0.9

Run `npm run db:migrate` before the new process serves traffic. Migration `0020` moves existing Project milestones and Task records onto Project task lines. Upgrade steps are in the Ops Manual, section 5.2.6. Catalog seed pack is `1.0.9-r1`.

- A Project’s lines are its tasks. A task can sit under another task, up to five levels, from the Parent task field or by dragging the row. The old Task record type is removed after the migration copies it.
- Drag a task by its handle to reorder it, place it under the task above, or move it out. A label shows what letting go will do. Arrow keys work on a focused handle.
- Percent complete is a slider. Task notes use the rich text editor.
- Pick a Project in the Projects list with the Gantt button to see its summary and Gantt in the Spatial Twin.
- The Project Gantt shows a status header, task totals, status-colored bars with progress, overdue tasks, the target date, and today, and it fits a narrow Twin pane.
- `/api/tasks` returns task notes as `description` (rich text) and `descriptionText` (plain text).

## 1.0.8

Bug fix. No new migration. Catalog seed pack stays `1.0.6-r3`.

- The phone menu uses the current canvas rows. It no longer keeps old public-link names.

## 1.0.7

No new migration. Catalog seed pack stays `1.0.6-r3`.

- Remove logo clears the image. Menu, home, and footer show the site icon until a logo is chosen again.
- The visitor theme button cycles Light, Dusk, Slate, Dark, and Architect. Settings → Appearance sets the default site theme.
- Home page logo size is 25% to 150%. Menu and footer stay 75% to 125%.
- Statistics and Pages are Custom Records in the sidebar, above Records Editor.
- A Pages body opens as Raw HTML in CodeMirror. Rich text asks before TipTap removes tags.
- A saved layout keeps the ID field where you place it.
- Only one Location per Organization can have Primary address on. The footer Location belongs to the Primary Org.

## 1.0.6

Status fields are picklists. Catalog seed pack `1.0.6-r3`. The next start rebases system Status fields and adds Phone and Email on Location. No database migration.

- The visitor footer address, phone, and email come from the Location with Primary address on. A Primary location is created when none exists.

- Contacts and Credentials use Record status (Active, Archived).
- Products use Product status (Available, Beta, Coming soon).
- Distribution, Executive, Communications, Dissemination, Production, Qualification, and Treasury use Faculty status (Active, Standby, Connected).
- Vendor uses Vendor status (Active, Standby, Connected).
- Organization, Customer, Partner, and Branch use Record status.
- A new record type that does not declare Status receives Record status.

## 1.0.5

Account mail. Run `npm run db:migrate` before restart (`auth_token`).

- Password reset, email confirmation, and a welcome message with a temporary password send once the system mailbox is active.
- Forgot password is hidden on the sign-in page until a mailbox credential is assigned.
- An agent administrator can still set a password through the API without the mailbox.
- Catalog seed pack stays `1.0.4-r2`.

## 1.0.4

Canvas menus, SEO, full HTML pages, and visitor sign-up.

- A signed-in user can view the site while maintenance mode is on.
- A canvas can be one full HTML page.
- The Public menu follows canvas and row menu switches.
- Each canvas has SEO fields. `/sitemap.xml` and `/robots.txt` list the canvases.
- Sky Animation has a site switch and a per-canvas switch.
- Header and footer can be turned off on each canvas.
- Canvas width is percent or pixels. Margin is pixels.
- Custom canvases after the first confirm before they are deleted.
- Email sign-up: the Contact driver's Sign-up form saves each visitor email as a public Contact.
- Page styles: one Pages record can style every HTML row on a canvas.
- Rows can use a Fit content height.
- Demo mode adds its own Demo canvas. It never writes the Primary canvas or canvases staff made. Demo off removes the Demo canvas.
- The demo Showcase canvas is gone.
- A Full page HTML record can hold a sign-up form. The system wires it; page scripts stay off.
- HTML records never cover the site header.
- Section arrows and snap scrolling work on Fit content rows. Tall rows scroll normally.
- Branding → Footer has a Copyright name field.
- The mobile header shows more of the site name.
- New canvases start at 75% width and 48px margin, and 85% width and 16px margin on mobile.
- Renaming a canvas keeps the same canvas.
- `/sitemap.xml` and `/robots.txt` list full URLs.
- Page Builder tabs are Branding, Canvas, Menu, Sky Animation. Appearance moved to Settings.
- The whole public site is stored in Postgres (`site_settings.body`). One database backup carries it. Run `npm run db:migrate` when upgrading.
- A fresh install opens with the Versa AGi site: Primary slides, the Analysis canvas, styles, and menus.
- On phones and tablets, Fit content rows show all their content instead of one clipped screen. The footer link columns center on phones.
- Promotion & Marketing: the Description field is labeled Content. Posts can hold up to 10 images, with a preview.

## 1.0.3

Four more drivers paint on the visitor canvas. Record lists open inside the row.

### Drivers

| Driver | What a Cell can paint |
|--------|------------------------|
| **Integration** | A table: vendor logo, vendor, integration, kind, status. |
| **Schedule** | A calendar. Planned days are teal. Today is gold when that day is on the board. |
| **Inspections & Reports** | The canvas row is labeled **Support Requests**. The table is the inspection records: name, status, summary. |
| **Project** | A table (project fields and task count), or cards that open that project's tasks. |

Schedule records: one schedule per integration, a Location lookup, and Custom times can add another row.

### Canvas

- Canvas width, margin, and row width each have a desktop value and a mobile value (below 1024px).
- An HTML Page fills its cell.
- The Hero has no Contacts button. The Contacts row stays.
- Default row height is 650px.

### Records

- A record list expands the row and shows the form inside it.
- These detail screens are gone: `/projects/[id]`, `/tasks/[id]`, `/products/[id]`, `/users/[id]`, `/agents/[id]`. The record APIs stay. Users still edit on `/users`.

### Not in this release

DM-02, AUTH-01, the held statistics-twin item (**B**), and PB-09 / #299 are unchanged. Catalog seed stays `1.0.2-r3`.

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
