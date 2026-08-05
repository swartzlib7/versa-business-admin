# State: Records Editor + Settings / Glossary chrome UX

| Field | Value |
|-------|-------|
| **Feature** | Records Editor UX + Settings IA polish (I5.6.41) |
| **Status** | 🔍 Gate 1 — I5.6.32 Slice 4 Task #230 Runtime saved-layout User pilot |
| **Last verified against code** | 2026-08-03 (agent/web-dev, Task #230) |
| **Primary code** | `src/components/settings/records-editor.tsx`, `src/app/settings/page.tsx`, `src/app/glossary/page.tsx`, `src/app/users/page.tsx`, `src/components/listing/entity-listing.tsx`, `src/components/ui/section-tabs.tsx` |
| **Task** | #230 I5.6.32 Slice 4 (plus prior #219/#220/#224) |
| **Source messages** | 5QtlTIWsvezycavae5An (prior 5-item), int_ba6a155650d240ab (2026-07-27 full list) |

## Collaboration
| Field | Value |
|-------|-------|
| **Mindset** | Building |
| **Pattern** | staged (three-gate) |
| **qa_reviewer** | pu |

## 1. Behavior / contract

### 1.1 Shared listing pattern (canonical)
All admin tables (zone entities, Records Editor Types/Fields/Picklists, Users, Glossary) use:

1. Header row with accent badge + **New X** button (toggles inline create form).
2. Create form opens **above** the table (not a side column).
3. Table of rows with visible **API name** (and internal id when available).
4. Inline expand/edit on row (EntityListing pattern) — View/Edit expands children in-place.
5. Optional filter controls above the table (not a separate parent-picker card).

Reference implementations: `entity-listing.tsx` (`New ${singular}`), zone ListingPanel, Glossary Sections/Entries (after alignment fix).

### 1.2 Settings chrome
- Top Settings tabs: **Records Editor | Branding | Appearance | System | Users** — **labels only, no hint/subtitle lines** under tab labels.
- Records Editor subtabs (Types | Fields | Picklists): **labels only, no hints**.
- Subtab row uses **accent inset** like zone sections (Executive etc.) via `SectionTabs` accent prop — Settings brand accent.
- **Remove** the muted explainer box about customizing zone entities / baked-in tabs.
- Page-level PageHeader subtitle for Settings may remain one line; **tab-level hints must go**.

### 1.3 Records Editor — Types
- **New Record Type** button top-right of panel (pattern: Collaboration / Vendor / Integration New …).
- Click opens create form **above** table.
- Parent entities + types presented as **table(s)**, not select+button list.
  - Preferred v1 layout:
    - Top: New Record Type control + form.
    - Below: table of record types with columns: Label, API name, Parent (kind + api_name), Structure, System?, Actions (expand/edit).
    - Optional filter: Parent (all / specific parent).
  - Built-in / system types (`is_system=true` seeds): **labels are editable** in this table (relabel). API names for system rows stay read-only unless already mutable in API.
- **Confirm prior docs:** `I5_6_32c_RECORD_TYPE_EDITOR.md` section 3.1 — `is_system` baseline seeds = true; **editable labels/fields carefully**. This UX is where relabel happens. Baked-in first-class objects (Project/Task/…) are still not created here; display labels for system record types / parent presentation are.

### 1.4 Records Editor — Fields
- Table of fields; columns include **Type** (parent record type), API name, Label, data_type, value_set/lookup, Actions.
- Optional filter control (current Type select becomes filter + remains a column).
- **New Field** button + form on top (same pattern).
- Inline row editor on expand.
- When data_type is picklist/lookup: **select existing value sets / objects** (no free-text hunt for API names) — from prior #205 item 2.

- **Type filter auto-applies** on change of the “All record types” dropdown (no extra Apply). `selectedTypeForFields` is included in the fields `useMemo` dependency list (Slice 2.1 #220).
### 1.5 Records Editor — Picklists
- Same pattern: **New Picklist** on top, table of value sets, expand row to see/edit **options** (options must be visible after add — prior #205 items 3–4).
- Bulk add options still supported inside expanded row (textarea to multiple options).

- Existing options render with an **× delete** control.
- On delete: if fixture references exist (field defaults / record instance values), UI prompts for a **replacement** from remaining options; API `DELETE /api/catalog/value-sets/:apiName` with `{ api_value, replacement_api_value? }` remaps then removes (Slice 2.1 #220).
### 1.6 Users + Records Editor navigation (UPDATED 2026-07-27 Gate 3)

Stephen Gate 3 (`kRfBiWcX8I1doALc2r31`) **supersedes** placing Users under Settings:

- **Users** is a **left-nav** item again → `/users` with main section Users and sub-tab **Configuration** (UsersPanel).
- **Records Editor** is a **left-nav** item (not under Settings) with main tabs Types | Fields | Picklists; each has sub-tab **Configuration**.
- **Settings** retains only **Branding | Appearance | System**.
  - Branding / Appearance → sub-tab **Configuration** (no duplicate panel title matching the tab name).
  - System → sub-tab **Information** (read-oriented content).
- Glossary: Sections | Entries each get sub-tab **Configuration** (align with Organization/Collaboration/Environment nested Configuration pattern in ZoneConfigView).
- Deep links: `/settings?tab=users` and `/settings?tab=records` redirect to new homes.

### 1.6b (historical) Users under Settings
Prior I5.6.41 briefly moved Users into Settings as a subtab. That placement is **reverted** by I5.6.43 in favor of left-nav + Configuration sub-tab consistency.

- Move **Users** into Settings as a **subtab** labeled **Users** (alongside Records Editor, Branding, Appearance, System).
- Users panel: **New User** button on top + EntityListing table (existing users page behavior).
- Keep `/users` route as deep link that renders the same panel or redirects into Settings `?tab=users` (prefer query tab for one chrome).
- Sidebar: prefer Settings Users tab as primary; sidebar may deep-link to Settings Users tab.

### 1.7 Glossary chrome
- **Blue accent** for Glossary badge, tabs inset, and primary buttons (e.g. `#2563eb`).
- **Left-aligned content** consistent with Settings/zone pages: remove `mx-auto max-w-5xl` centering constraint (match Settings full-width `space-y-6` shell).
- Tab hints: drop subtitle hints on Sections/Entries tabs for parity with Settings (labels only).

### 1.9 Runtime saved-layout User pilot (I5.6.32 Slice 4, Task #230)
- The Layout Editor can save separate **Edit** and **Detail** layouts for the bounded `user` pilot.
- User detail and edit fetch the saved layout per mode at runtime. Its section order, labels, column count, visible fields, field order, and field span control rendering.
- Saved configuration is treated as optional/untrusted presentation data: malformed, stale, empty, or unavailable layouts fall back to the catalog default without breaking the User view.
- Layout Editor selection is isolated by `(objectApiName, layoutType)`: changing either clears the prior configuration and blocks editing until the current fields and saved layout resolve. A selection with no saved layout mounts its own catalog-derived default; aborted or superseded async responses cannot overwrite the current selection.
- User save remains explicitly session-local/mock: no new persistence API, database migration, generic-record CRUD, or additional object runtime support is introduced.

### 1.8 Non-goals (this slice)
- No new backend record model.
- No Phase-2 DB cutover.
- No Buffer / Interview work.
- Do not re-open rings / #201 layout unless regression found.


### 1.7 Heading hygiene (I5.6.44 #210)

**Rule (sitewide):** Under an active main tab or sub-tab, do NOT render a large heading / CardTitle / EntityListing title that repeats the tab label. Keep subtitle/description only.

Applied to:
- Records Editor Types/Fields/Picklists → Configuration sub-tab: CardTitle removed, subtitle only.
- Glossary Sections/Entries → Configuration sub-tab: CardTitle removed (including `Configuration · SectionName` derivative), subtitle only.
- Settings Branding/Appearance → Configuration sub-tab: PanelShell CardTitle removed, subtitle only.
- Settings System → Information sub-tab: PanelShell CardTitle removed, subtitle only.
- Users → Configuration sub-tab: EntityListing title removed, subtitle only.
- ZoneConfigView FormPanel: CardTitle panel.label removed, subtitle only.
- ZoneConfigView ListingPanel: EntityListing title prop removed, subtitle only.
- EntityListing component: `title` prop made optional; CardTitle rendered only when title is non-empty.

### 1.8 Rings default 50% (I5.6.44 #210)

- Dashboard `ringsMode` useState initial value changed from `'on'` to `'50'`.
- localStorage persistence: if `ringsMode` key exists in localStorage, that value is honored; otherwise default `'50'`.
- MissionControlScene internal default changed from `'on'` to `'50'`.
- ZoneConfigView twin scene `ringsMode` prop changed from `'on'` to `'50'`.
- Cycle order unchanged: On → 50% → 25% → 10% → Off → On.

## 2. Current State (2026-07-27)
- Records Editor: parent select + type button list + side create form; explainer box present; subtab hints present.
- Settings tabs: hints on each tab.
- Fields: type select + table + free-text value_set in places.
- Picklists: forms without durable options visibility in table expand.
- Users: standalone `/users` page with EntityListing + View button (post-#201).
- Glossary: `max-w-5xl mx-auto`, own ACCENT, tab hints still on PageHeader tabs.
- Beta live **0.7.61** with prior layout/rings work.

## 3. Target State
- One consistent admin chrome: accented subtabs, no tab subtitles, EntityListing-style New+table+inline edit across Records Editor + Users-in-Settings + Glossary alignment/accent.
- Built-in/system type **relabel** supported in Types table.
- Spec + code aligned; Stephen visual Gate 3 on :3200 after Gate 2.

## 4. Backlog / Plan (WBS)

| ID | Deliverable | Depends | Agent verify | QA | Status | Task ID |
|----|-------------|---------|--------------|-----|--------|---------|
| RE-UX-0 | Spec fold (this state) + web-dev brief | — | COA | — | done | #205 |
| RE-UX-1 | Settings chrome: drop tab/subtab hints; remove explainer; accent subtabs; add Users tab | RE-UX-0 | web-dev tsc/build | PU visual | planned | #205 |
| RE-UX-2 | Types: New Record Type + table + system relabel | RE-UX-1 | web-dev | PU | planned | #205 |
| RE-UX-3 | Fields: table + Type column/filter + New Field + picklist select | RE-UX-1 | web-dev | PU | planned | #205 |
| RE-UX-4 | Picklists: New + table + expand options visible | RE-UX-1 | web-dev | PU | planned | #205 |
| RE-UX-5 | Glossary: blue accent + left align + tab label-only | RE-UX-0 | web-dev | PU | planned | #205 |
| RE-UX-6 | Gate 2 COA + Gate 3 Stephen on :3200 | RE-UX-1..5 | COA | PU | planned | #205 |
| RUNTIME-1 | User runtime saved edit/detail layouts plus catalog fallback | Slice 3 Layout Editor | web-dev tsc/build | COA Gate 2, PU Gate 3 | Gate 1 complete | #230 |

## 5. Results Feedback
| Date | Result |
|------|--------|
| 2026-07-27 | Stephen full list captured; reconciled with #205 prior 5 items; built-in relabel confirmed in 32c doc (`is_system` editable labels). |

## 8. IA Configuration Pattern (I5.6.43 #209)

### Behavior
- Left nav = top-level destinations: Dashboard, Organization, Collaboration, Environment, Glossary, Users, Records Editor, Settings.
- Users → /users (own top-level page with UsersPanel + Configuration sub-tab).
- Records Editor → /records-editor (own top-level page wrapping RecordsEditor + Configuration sub-tab).
- Settings → /settings with tabs: Branding | Appearance | System only.
- Under each main tab: Configuration sub-tab (or Information for System).
- No duplicate panel titles that repeat the main tab name.
- Old ?tab=users redirects to /users; ?tab=records redirects to /records-editor.
- Shared SubTabBar component (src/components/ui/sub-tab-bar.tsx) matching ZoneConfigView inner strip pattern.


## I5.6.32 Slice 2 — Records Editor UI (Task #219) — 2026-07-28

### Delivered
- `/records-editor` Suspense wrap for `useSearchParams`.
- Parent filter initializes from `?parent=kind:api_name` query param; New Type form prefills parent.
- Type row expand editor: label, description, structure (list/header/header_lines), sort_order, show_as_tab, active → `PATCH /api/catalog/record-types/:apiName`.
- Fields preview badges on expanded type + link to Fields tab filtered by type.
- Zone Configuration "record types" link points to `/records-editor?parent=${parentKind}:${parentApiName}`.

### Gate
- Gate 2: COA on :3200
- Gate 3: Stephen visual

## I5.6.32 Bounded correction — dynamic visibility and Parent taxonomy (Task #233) — 2026-08-05

### Behavior
- Zone pages fetch active record types from the existing catalog endpoint on client mount, then merge them with static zone tabs. A type created in Records Editor is therefore visible after normal client navigation to its parent zone and after a browser refresh; no generic persistence or CRUD scope was added.
- Parent choices use human-readable taxonomy labels while retaining stable API values: **Organization** — Executive, Public, Communications, Dissemination, Treasury, Production, Qualification; **Collaboration** — Vendor, Customer, Partner, Branch; **Environment** — Locations, Events, Knowledge, Schedules.

### Root cause
- Zone pages derived their tab model during the server/client render from process-local fixture state. After an editor-side POST, client-side navigation could retain a route payload computed before that in-memory mutation, so the newly created type was not reliably present. The parent list also exposed raw internal `kind:api_name` values and modeled Environment only as its root instead of its four documented children.

### Validation
- TypeScript no-emit passed.
- Targeted ESLint is blocked by two pre-existing `react-hooks/set-state-in-effect` errors in Records Editor's existing load effects; the changed zone/runtime files lint clean apart from that inherited file-level result.

## 6. Change Log
| 2026-08-03 | I5.6.32 Slice 4 #230 corrective pass: Layout Editor now clears prior state on object/mode changes, remounts each selection from its saved config or catalog default, and ignores aborted/superseded async fetch responses. Focused ESLint and TypeScript validation clean; Gate 2 re-review requested. |
| 2026-08-03 | I5.6.32 Slice 4 #230: Layout Editor now selects and persists separate edit/detail configurations; User detail/edit consumes saved User layouts at runtime and safely falls back to catalog defaults. Saved layout sections honor ordering, visibility, columns, and field span. User writes remain mock/session-local. tsc clean. |
| Date | Change |
|------|--------|
| 2026-07-28 | I5.6.32 Slice 2 #219 Records Editor: contextual `?parent=` entry from zone Configuration links; Suspense boundary for useSearchParams; expanded type row editor (label, description, structure, sort_order, show_as_tab, active) via PATCH; fields preview on type expand + Manage Fields jump; CreateForm initialValues for parent prefill; ZoneConfigView record-types link → `/records-editor?parent=kind:api`. tsc clean. |
| 2026-07-27 | State created from msg int_ba6a155650d240ab + prior #205; implementation brief issued to web-dev. |
| 2026-07-27 | I5.6.44 #210 rings default 50% + heading hygiene (0.7.65, 46fe780): A) Rings default initial state 50% (dashboard + mission-control-scene + zone twin). localStorage persistence honors existing preference. B) Sitewide heading hygiene — removed CardTitle/EntityListing title that repeats active sub-tab label across Records Editor, Glossary, Settings, Users, ZoneConfigView. EntityListing title prop made optional. tsc+build clean. |
| 2026-07-27 | I5.6.43 #209 IA Configuration pattern (0.7.64, 604e4b3): Left nav restructured (Users→/users, Records Editor→/records-editor, Settings→/settings with Branding/Appearance/System only). Shared SubTabBar component. Configuration sub-tab under Glossary Sections/Entries, Records Editor Types/Fields/Picklists, Users, Settings Branding/Appearance. Information sub-tab under Settings System. Old ?tab=users/?tab=records redirect. Panel titles renamed to avoid duplication. tsc+build clean. |

## 7. Reconciliation — already specced vs new

| Item | Prior status | Action |
|------|--------------|--------|
| Types as table + API names + expand children | Specced in #205 item 1 | Keep + refine to New-button-on-top pattern |
| Fields picklist/lookup select not free text | Specced #205 item 2 | Keep |
| Picklists table + expand options + bulk add | Specced #205 items 3–4 | Keep |
| Built-in/system relabel | Specced in I5.6.32c is_system editable labels | Surface explicitly in Types table UX |
| Remove explainer box | NEW (this message) | Add |
| Remove Settings tab + subtab subtitles/hints | NEW | Add |
| Subtab accent like zones | Partially (brand accent exists); enforce parity | Add |
| Users moved into Settings subtab | NEW | Add |
| Glossary blue accent | NEW | Add |
| Glossary not center-aligned | NEW | Add |
| New Record Type / New Field / New Picklist button pattern | Implied by EntityListing; not fully applied in Records Editor | Make explicit |

### Slice 2.1 (#220) — 2026-07-28
1. Fields: record-type dropdown filter applies immediately (`selectedTypeForFields` in memo deps).
2. Removed unspec'd seed record types + default fields: public_record, communication_log, dissemination_channel, treasury_item, qualification_record (and catalog object/field seeds). Parents remain; types created via editor.
3. Picklists: option × delete + replacement prompt when references exist (fixture catalog + API DELETE).

