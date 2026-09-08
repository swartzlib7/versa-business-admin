# State: Mission UI layout (2D chrome + 3D hub)

> **Role:** Sole go-to for Versa - Business Admin shell layout direction (sidebar, header, 3D viewport, zone pages).
> **Product:** Versa-BusinessAdmin · Project #26
> **Doc home:** docs/production/state/
> **Map:** shape_business_admin.md

| Field | Value |
|-------|-------|
| **Feature** | Application layout / IA chrome |
| **Status** | 🔧 In progress — 0.7.156 min-height floor on sub-tab content containers (zones + glossary included) |
| **Last verified against code** | 2026-09-07 |
| **Primary code** | `src/app/**`, hub scene components, zone pages |
| **Former doc** | `docs/research/LAYOUT_PROPOSAL.md` (superseded seed) |

**Folded sources (2026-07-20):** `docs/research/LAYOUT_PROPOSAL.md` → `__archive/LAYOUT_PROPOSAL.md`.

---

## 1. Behavior / contract

### 1.1 Binding boundaries
- Versa - Business Admin — **not** agitop.
- Agents are only a **user type** — no Active Agents / Agent Status / fleet chrome.
- 3D graph = Organization / Collaboration / Environment zones (keystone), not Games-of-Life or agent activity graphs.
- Detail: zone UI pattern — nested tabs with parent self/default first (see `state_i5_6_zone_erd.md`).

### 1.2 Layout layers

| Layer | Direction |
|-------|-----------|
| Sidebar (2D) | Business nav: Dashboard, Users, work surfaces, zone surfaces (Organization / Collaboration / Environment), Glossary, Settings — **no** agent fleet |
| Header (2D) | Search, profile, familiar business chrome; username → users |
| 3D viewport | Keystone ERD hub; Versa AGi brand; lightbox expand; billboard labels; zone-embedded twins on zone routes |
| Detail (2D) | Zone config tabs; projects/tasks tables; users admin |
| Content container | Every page content container below the sub-tab strip (role=tabpanel) carries min-h 640px (0.7.156) so short pages keep a consistent working area — includes Settings/Users/Contact/UI Components/Records Editor, Glossary (5 tabs), and all zone pages via ZoneConfigView |

### 1.3 Explicit non-goals (from superseded seed)
- Agent fleet status in sidebar
- Agent activity nodes / token spheres as primary viz
- Games of Life as default 3D graph

### 1.4 Relationship to zone ERD state
Spatial node positions, orbit rules, and zone tab ownership live in **`state_i5_6_zone_erd.md`**. This layout state owns shell IA only — do not duplicate hub math here.

---

## 2. Current State
- Hybrid 2D + R3F shell shipped through I5.6 hub line (package 0.7.45).
- Zone routes embed active-zone hub with **hideable spatial twin drawer** (I5.6.31).
- Hub spheres **static by default** with improved 3D shading (I5.6.31).
- Early LAYOUT_PROPOSAL was already marked superseded; content folded for single living home.

## 3. Target State
- One layout state doc; research seed archived.
- Further chrome changes logged here; hub geometry logged in zone ERD state.

## 4. Backlog / Plan
| ID | Item | Priority |
|----|------|----------|
| LAY-1 | Keep nav list aligned with shipped routes | ongoing |
| LAY-2 | Remove residual `/agents` UI when product-ready | later |
| LAY-3 | Cross-link only — hub visuals owned by zone ERD state | n/a |

## 5. Results Feedback
| Date | Result |
|------|--------|
| 2026-07-20 | Statefold from LAYOUT_PROPOSAL; archive seed |

## 6. Change Log
| Date | Change |
|------|--------|
| 2026-07-20 | I5.6.30 docs: state_layout_mission_ui created |

## I5.6.31 — Spatial twin drawer + hub sphere defaults (2026-07-22)

**Stephen request:** On Organization / Collaboration (Calibration) / Environment zone menus, put the right-side spatial twin in a hideable drawer; remember last open/closed; when hidden, main content uses the full width. Hub spheres: not animated by default; more 3D shading (less flat moving dots).

**Behavior:**
- Zone pages (`ZoneConfigView`): toggle **Hide twin / Show twin** (header) + Hide on drawer chrome; state key `mc.spatialTwinOpen.{organization|collaboration|environment}` in `localStorage`.
- Open: `lg:grid-cols-5` (content 3 / twin 2). Closed: single column — forms/lists expand.
- Hub (`/dashboard` + scene internal default): `animSpeed` starts at **0** (Speed control still cycles 0→1→5…).
- Sphere look: higher metalness, lower emissive wash, directional key/fill lights, BackSide rim shells, 48-seg meshes.

**Code:** `zone-config-view.tsx`, `business-admin-scene.tsx`, `dashboard/page.tsx`.

### Change log
| Date | Change |
|------|--------|
| 2026-07-22 | I5.6.31 shipped on beta — drawer + static/3D spheres |

## I5.6.32a — Main nav de-dupe (2026-07-22)

Sidebar top-level **Projects / Tasks / Products** removed. Access via Organization zone (Executive / Production). Deep-link routes remain. Favorites/shortcuts deferred.

## I5.6.34 — Stable zone chrome (2026-07-24) — SHIPPED

**This is the definition entry.** I5.6.34 is not an unbuilt increment.

| Field | Value |
|-------|--------|
| **What** | Stable zone chrome: one sticky container for zone header + primary tabs. Sub-tab strip + description sit in a stable slot outside the card body so the layout does not jump when the sub-tab changes. No repeated faculty heading inside sub-tab panels. |
| **When** | 2026-07-24 |
| **Code** | `src/components/zones/zone-config-view.tsx` (file header comment + TabPanel) |
| **Status** | Shipped. Follow-ons: I5.6.35 (twin static, description once, restore sub-tabs), I5.6.38 (badge cleanup). |

**“I5.6.34+” after I5.6.33 Gate 3 (2026-09-02)** is a **hold label**, not a second definition. It means: do not start a **new** zone-chrome / IA train until the Primary User tasks it. Search this heading for I5.6.34 itself.

## I5.6.34+ UI recovery hold (2026-07-24)

**Stephen:** Unhappy with UI after web-dev handoff; Twin inconsistent/animated across pages without request; zone layouts worse than earlier better state.

**Branch:** `dev/ui-recovery-2026-07-24` (from beta 204b762) — full tip union verified (coa + web-dev + origin all in beta).

**Twin fact:** `twinAnimSpeed = organization ? 1 : 0` since I5.6.19 (COA); I5.6.31 set dashboard static default but left org twin live. 0.7.54 did not change behavior.

**Hold:** No new web-dev UI slices until Stephen picks recovery path. Full write-up: `docs/coa/UI_RECOVERY_REVIEW_2026-07-24.md`.


## I5.6.35 — Stephen recovery path locked (2026-07-24 evening)

**Stephen decisions (msg int_ac05a5e2ff384146):**
1. **Twin:** relevant element/zone only; **no animation** on zone twins. Zoom levels OK as-is.
2. **Duplicate sub-heading:** On Organization (and same layout pattern), summary/sub-heading must appear **once**. Remove the **top** duplicate; keep a single description. Apply as design pattern on all pages using this layout style (zone `ZoneConfigView`, and any PageHeader/section stack that repeats the same blurb).
3. **Sub-tabs:** Primary tab badge e.g. Executive (4) implies nested sub-tabs **must be visible**. Restore if missing (regression vs I5.6.34 intent).
4. **Process:** COA judges SE skill gaps + statefold need, reports to Stephen; **web-dev implements** the fixes from current work state.

**Code targets:**
- `zone-config-view.tsx`: `twinAnimSpeed = 0` all zones; TabPanel must not render `panel.summary` both above body **and** inside `FormPanel` CardHeader — one surface only (prefer single description in stable slot **or** in card header, not both; Stephen: drop the **first/top** instance).
- `SubTabBar` must render whenever `tab.children?.length > 0` (badge count = children+1); verify not covered by sticky chrome / not gated incorrectly.
- Pattern pages: Settings/Glossary/Users via `PageHeader` — audit for double description.

**Statefold:** This section + zone ERD twin note are the contract. Handoff must cite them. No parallel spec files.

**Branch:** `dev/ui-recovery-2026-07-24` (do not commit recovery fixes to beta until COA verify + Stephen OK).


### Verified delivery (2026-07-24 night)

| Item | Result |
|------|--------|
| Commit | `b4483bc` on `dev/ui-recovery-2026-07-24` |
| Twin | `twinAnimSpeed = 0` all zones |
| Description once | Removed TabPanel stable-slot `<p>{panel.summary}</p>`; single render in FormPanel / EntityListing header |
| Sub-tabs | SubTabBar path unchanged; web-dev SSR smoke org total=1 (was 2) |
| COA code review | PASS — await Stephen visual OK before beta merge |


## I5.6.38 — Zone pages UI cleanup (2026-07-28)

**Stephen request:** Remove spatial twin border and top mock badge on zone pages.

**Changes:**
- `zone-config-view.tsx`: Removed `border border-border` from spatial twin wrapper div.
- `zone-config-view.tsx`: Removed top colored dot + 'Zone config · mock' badge container.

### Change log
| Date | Change |
|------|--------|
| 2026-07-28 | I5.6.38: Zone pages UI cleanup (border + mock badge) |

## I5.6.32 Slice 1 \u2014 Live Dynamic Records Integration (2026-07-28)

**Request:** Implement live dynamic record queries for Organization, Collaboration, and Environment zone pages.

**Behavior:**
- `ZoneConfigView` (\`ListingPanel\`): Fetches records from \`/api/records?type=...&parent_kind=...&parent=...\` when \`recordTypeApiName\` is present on the tab.
- **Persistence:** \`onAdd\` and \`onUpdate\` in \`ListingPanel\` now call the API (\`POST /api/records\` and \`PATCH /api/records/[id]\`) for dynamic record tabs.
- **Metadata:** \`ZoneTab\` extended with \`recordTypeApiName\`, \`parentKind\`, and \`parentApiName\`.
- **Integration:** \`applyRecordTypesToTab\` in \`record-type-tabs.ts\` populates the new metadata fields from the Records Editor configuration.
- **UI Feedback:** Added loading and error states to \`ListingPanel\`. Added "Dynamic Record" badge for API-driven rows.

**Code:** `zone-config-view.tsx`, `record-type-tabs.ts`.

## 0.7.104 — Page chrome + menu order (2026-09-02)

**Stephen feedback (IDE):** Dashboard subtitle drop “Versa AGi”; remove four top KPI cards (widget later). Title region is a design pattern on all operator pages:

- No colored pill that repeats the page title.
- Remaining actions (Full 3D hub, Hide twin, theme) sit on the title line, top right.
- Subtitle spans the full row.
- Title region + first tab row have no flat background plate.
- First tab line is required on every page (Users, UI Components, Contact were missing it).
- Colored sub-tab is required; empty content lives under **Records** unless the tab is a non-record view (Glossary View / Org Board).
- **IA (0.7.106):** singular **main** tab, plural **sub-tab**, with exceptions (Contact menu + Records sub-tab; Users Human/Agent + Records; Settings Configuration; UI Components uses gallery section sub-tabs). Environment listing no longer repeats a "Records" title above the table.
- Users / UI Components / Contact / Statistics brought into that pattern.
- Menu + page title **Statistics**; main tab **Stats**; sub-tab **Records**.
- New **Settings → System → Menu** reorders sidebar items (persisted `menu_order` on site settings).

**Code:** `page-header.tsx`, `zone-config-view.tsx`, `dashboard/page.tsx`, `users/page.tsx`, `ui-components/page.tsx`, `contact/page.tsx`, `zone-definitions.ts` (statsZone), `sidebar.tsx`, `lib/nav.ts`, `menu-order-panel.tsx`, `settings/page.tsx`, `api/settings/system`.

### Change log
| Date | Change |
|------|--------|
| 2026-09-02 | 0.7.104 chrome pattern + Statistics rename + menu reorder |
| 2026-09-03 | Moved to docs/production/state/; shape_business_admin.md is the map |
| 2026-09-03 | Menu reorder is drag-and-drop (same pattern as table columns); 0.7.105 |
| 2026-09-03 | 0.7.106 singular main / plural sub-tab IA; dashboard Open home page; homepage logo 20% |
| 2026-09-03 | 0.7.107: required sub-tab on every page; zone twin drawer; listing action stack; Glossary Configuration |
| 2026-09-04 | 0.7.109: zone/Statistics main tabs use PageHeader (same height); Contacts + UI Components match Settings card header shading |
| 2026-09-07 | 0.7.137: Settings → Menu Operator / Public; On/Off + route 404 |
| 2026-09-08 | 0.7.155: min-h-[640px] on all 14 sub-tab content containers (role=tabpanel; contact, settings ×7, ui-components, users, records-editor ×4) — Stephen request; E2E computed-style verified 640px floor, tall pages unaffected |
| 2026-09-08 | 0.7.156: same floor on the missed surfaces — Glossary (5 tabpanels) and ZoneConfigView content region below the sub-tab strip (Organization / Collaboration / Environment / Stats). 0.7.155 never reached those pages, which is why not every page held the floor. |

## 0.7.107 — Chrome contract (2026-09-03)

**Required on every operator page:** a main tab strip **and** a sub-tab strip. The standard first (often only) sub-tab is **Configuration**, including Settings **Menu** and **Modes**. Contact uses Configuration (not Records) with an opening sentence and a full-width form.

**Listing action cluster (global):** the New Record (or equivalent) **button stays on the right** and does not wrap under the summary. The Dynamic Record / listing **tag sits under the button**, also right-aligned.

**Zone pages (Organization / Collaboration / Environment):**
- Main tabs use the shared `PageHeader` / `SectionTabs` (same height as Settings / Records Editor).
- Sub-tab strip is the **pill** SubTabBar (same as Records Editor), full content width.
- Spatial twin sits **below** the sub-tab strip, **inside** the content region (right of the listing).
- Caption **below** the canvas: `Spatial Twin · click spheres [Full 3D Hub]`.
- Hide twin is a **drawer handle on the left edge** of the twin (10px padding); chevrons collapse/expand.
- Statistics is not a hub zone — no Full 3D hub / twin.

**Organization:** staff appointment and Primary Org live on a **Configuration** main tab at the **end** of the strip. Production sub-tabs are **Products** and **Services** (operator-facing copy, not design notes).

**UI Components:** each former gallery sub-tab is a **main tab** (Buttons, Inputs, Badges, Cards, Separators). No repeating section heading.

**Glossary:** default main tab is **Sections**. Title **GLOSSARY OF TERMS** (serif, uppercase, large). **Configuration** last: toggle Glossary on the operator sidebar; toggle Org Board tab.

**Default theme:** Dark (operator and public).

**Settings:** Branding, Menu (Operator / Public sub-tabs), Cycle Strip, Appearance, Modes (`?tab=modes`; `information`/`system` aliases), Sky Animation, **API** (0.7.142 — live HTTP catalog). Configuration strip on Branding, Appearance, Cycle Strip, Modes, and API. Menu uses Operator / Public. Sky Animation has no sub-tab strip. Operator and public menu items have On/Off; off also 404s the route (Settings cannot be turned off).

## 0.7.142 — Product identity VBA (2026-09-07)

Dashboard heading **Versa - Business Admin**; hub **VBA Hub**; public Facets label (no “Mission Control Facets”); footer **VBA**.

## 0.7.141 — Collapsible operator rail + API docs (2026-09-07)

**Stephen (IDE):** API complete for this version with documentation linked in the backend. Backend menu collapsible with symbols only.

**Behavior:**
- Operator sidebar (`variant=rail`) collapses to a 3.5rem icon rail. Collapse control at the bottom; labels become `title` tooltips. Preference: `localStorage` key `ba.sidebarCollapsed`.
- Phone sheet uses `variant=drawer` (labels always on).
- Main column padding follows the rail (`lg:pl-56` / `lg:pl-14`).
- Settings → **API** renders GET `/api` (same catalog agents read).

**Code:** `sidebar.tsx`, `app-shell.tsx`, `header.tsx`, `api-docs-panel.tsx`, `lib/api/inventory.ts`, `src/app/api/route.ts`.

## I5.6.34 definition restored (2026-09-08)

Definition entry for **I5.6.34 — Stable zone chrome** added above the 2026-07-24 recovery hold. “I5.6.34+” after Gate 3 is a hold, not a missing increment.

