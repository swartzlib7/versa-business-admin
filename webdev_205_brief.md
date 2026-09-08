# Web-dev brief — I5.6.41 / Task #205
# Records Editor UX overhaul + Settings/Glossary chrome

**From:** COA (Versa)  
**To:** web-dev  
**Date:** 2026-07-27  
**Base branch:** `beta` at `cf4712c` (0.7.61) — branch `agent/web-dev` from latest beta  
**Target version:** **0.7.62**  
**Living state:** `docs/design/spec/state/state_records_editor_ux.md`  
**Three-gate:** implement → COA Gate 2 on :3200 → Stephen Gate 3 visual  

Do **not** start unrelated slices. This is the next item after rings/layout merge.

---

## Why

Stephen confirmed several items were mentioned before and wants them **documented and built now**. He also asked whether we document-first (yes — three-gate). He is willing to pause new requirements once this is in flight.

---

## Scope (ship all in one version bump 0.7.62)

### A. Settings chrome
1. Settings top tabs: Records Editor, Branding, Appearance, System, **Users** — **labels only** (remove all `hint` / subtitle lines under tabs).
2. Records Editor subtabs Types | Fields | Picklists — **labels only** (no hints).
3. Subtab row: keep/ensure **accent inset** like zone sections (Executive etc.) via `SectionTabs` accent.
4. **Delete** the explainer box in `records-editor.tsx`:
   > Customize zone entities including baked-in tabs...
5. Wire **Users** as Settings tab content:
   - Reuse existing Users EntityListing + New User pattern from `src/app/users/page.tsx`.
   - `/users` should deep-link to Settings Users (e.g. redirect to `/settings?tab=users` or render same panel).
   - Sidebar Users entry may point at Settings Users tab.

### B. Records Editor — Types
1. **New Record Type** button on top (EntityListing / zone New pattern).
2. Create form opens **above** the table when New is clicked.
3. Replace parent `<select>` + button list with a **table** of types:
   - Columns: Label, API name, Parent (kind + api_name), Structure, System?, Actions.
   - Optional Parent filter above table.
4. Row expand/inline edit (EntityListing-style). Expanded view shows type details + path to fields.
5. **System/built-in relabel:** rows with `is_system` (or equivalent) allow **editing label**; api_name read-only for system rows. Confirmed in `docs/coa/I5_6_32c_RECORD_TYPE_EDITOR.md` (§ is_system editable labels). If PATCH label API is missing, add minimal PATCH on record-type for `label` (and safe fields only).

### C. Records Editor — Fields
1. **New Field** button + form on top.
2. Fields as **table** with **Type** as a column.
3. Optional Type filter (replace “Type select as only navigator”).
4. Inline editor on row expand.
5. For picklist/lookup data types: dropdown of existing value sets / lookup targets — **no free-text API name hunting**.

### D. Records Editor — Picklists
1. **New Picklist** button + form on top.
2. Table of value sets; expand row to **list existing options** and add/edit options (bulk textarea OK inside expand).
3. Options must remain visible after add (fix prior bug).

### E. Glossary
1. **Blue accent** (`#2563eb` or theme blue) on badge, tab inset, primary buttons.
2. **Left-align** with Settings/zone pages — remove `mx-auto max-w-5xl` centering wrapper; use same shell spacing as Settings (`space-y-6` full content width).
3. Sections/Entries tabs: **labels only** (drop hints) for parity.

---

## Out of scope
- Rings, #201 layout regressions (unless you break them)
- Buffer packs, interviews, exchange creds
- DB cutover / new record storage model

---

## Files likely touched
- `src/components/settings/records-editor.tsx` (major)
- `src/app/settings/page.tsx` (tabs, Users panel)
- `src/app/users/page.tsx` (redirect or thin wrapper)
- `src/app/glossary/page.tsx` (accent + width + tab hints)
- `src/components/ui/section-tabs.tsx` / `page-header.tsx` only if needed for label-only tabs
- `src/components/listing/entity-listing.tsx` (reuse; extend only if required)
- Catalog API routes if label PATCH / options list incomplete
- `src/app/api/health/route.ts` → version **0.7.62**
- `package.json` version **0.7.62**

---

## Acceptance checklist
- [ ] No tab/subtab subtitle hints on Settings or Records Editor or Glossary tabs
- [ ] Explainer box gone
- [ ] Records subtabs have zone-like accent
- [ ] Types/Fields/Picklists each: New button → form on top → table → inline expand
- [ ] API names visible in tables
- [ ] System types relabelable (label)
- [ ] Fields: Type column + filter; picklist/lookup selects
- [ ] Picklist options visible after add
- [ ] Users under Settings with New User on top
- [ ] Glossary blue + left-aligned
- [ ] `tsc` clean, production build clean
- [ ] :3200 serves 0.7.62 health
- [ ] Commit message references I5.6.41 / #205

## Process
1. Branch from latest `beta`.
2. Implement + self-check checklist.
3. Commit + notify COA with commit hash and version.
4. Stop for Gate 2 — do not merge to beta yourself.

Brief path (agent home): `workspace/Versa-BusinessAdmin/docs/handoff/web_dev_slice_2026-07-27_records_editor_ux_205.md`
