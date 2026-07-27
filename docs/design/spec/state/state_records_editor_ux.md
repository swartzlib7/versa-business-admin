# State: Records Editor + Settings / Glossary chrome UX

| Field | Value |
|-------|-------|
| **Feature** | Records Editor UX + Settings IA polish (I5.6.41) |
| **Status** | In progress — brief locked for web-dev |
| **Last verified against code** | 2026-07-27 (beta 0.7.61 / cf4712c) |
| **Primary code** | `src/components/settings/records-editor.tsx`, `src/app/settings/page.tsx`, `src/app/glossary/page.tsx`, `src/app/users/page.tsx`, `src/components/listing/entity-listing.tsx`, `src/components/ui/section-tabs.tsx` |
| **Task** | #205 |
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

### 1.5 Records Editor — Picklists
- Same pattern: **New Picklist** on top, table of value sets, expand row to see/edit **options** (options must be visible after add — prior #205 items 3–4).
- Bulk add options still supported inside expanded row (textarea to multiple options).

### 1.6 Users under Settings
- Move **Users** into Settings as a **subtab** labeled **Users** (alongside Records Editor, Branding, Appearance, System).
- Users panel: **New User** button on top + EntityListing table (existing users page behavior).
- Keep `/users` route as deep link that renders the same panel or redirects into Settings `?tab=users` (prefer query tab for one chrome).
- Sidebar: prefer Settings Users tab as primary; sidebar may deep-link to Settings Users tab.

### 1.7 Glossary chrome
- **Blue accent** for Glossary badge, tabs inset, and primary buttons (e.g. `#2563eb`).
- **Left-aligned content** consistent with Settings/zone pages: remove `mx-auto max-w-5xl` centering constraint (match Settings full-width `space-y-6` shell).
- Tab hints: drop subtitle hints on Sections/Entries tabs for parity with Settings (labels only).

### 1.8 Non-goals (this slice)
- No new backend record model.
- No Phase-2 DB cutover.
- No Buffer / Interview work.
- Do not re-open rings / #201 layout unless regression found.

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

## 5. Results Feedback
| Date | Result |
|------|--------|
| 2026-07-27 | Stephen full list captured; reconciled with #205 prior 5 items; built-in relabel confirmed in 32c doc (`is_system` editable labels). |

## 6. Change Log
| Date | Change |
|------|--------|
| 2026-07-27 | State created from msg int_ba6a155650d240ab + prior #205; implementation brief issued to web-dev. |

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
