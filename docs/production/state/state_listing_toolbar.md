# State: Listing toolbar (filter, columns, search)

> **Role:** Sole go-to for shared backend table chrome — filters, visible columns, record-name search.
> **Product:** Versa-BusinessAdmin · Project **#26**
> **Doc home:** docs/production/state/
> **Map:** shape_business_admin.md

| Field | Value |
|-------|-------|
| **Feature** | Shared listing toolbar on all backend `EntityListing` tables |
| **Status** | 🟢 Built + QA passed (WU-01–WU-05) 2026-09-08 — Stephen: “Looks perfect.” Promoted 0.7.158 via beta → master |
| **Last verified against code** | 2026-09-08 |
| **Primary code** | `src/components/listing/entity-listing.tsx` |
| **Task** | Parent **#282**; WU-01 **#283**; WU-02 **#284**; WU-03 **#285**; WU-04 **#286** |

---

## Collaboration

| Field | Value |
|-------|-------|
| **Mindset** | Building |
| **Pattern** | staged |
| **qa_reviewer** | pu |
| **QA display name** | Stephen |

Notes: Visual QA on `:3200`. Look good. If a cleaner filtering pattern beats the brief, use it — do not cargo-cult a clunky control.

---

## 1. Behavior / contract

Applies to **every backend table list** that uses `EntityListing` (Organizations is the reference; zone listings, Users, Records Editor tables, Collaboration tabs, etc.). Public visitor pages are out of scope.

### 1.1 Toolbar row

One compact toolbar above the table, left-to-right (wrap on narrow widths):

1. **Record search** — searches record **name** values (the name/label cell, not every field).
2. **Column filter** — pick a column currently rendered on the table, then a second-stage control: picklist of that column’s values when the field has options (select with options, boolean), **or** a typed value for every other rendered, non-secret column. **Add** commits it as a criterion; Enter also commits a typed value.
3. **Column picker** — multi-select of **every non-secret ERD field** that can be a table column for that object (not only the currently rendered set). Default-hidden fields (`column: false`, including platform audit `created_by` / `last_modified_by` and extra typed-core fields) appear unchecked. Bound to the current visible set. Unselected columns are visually distinct (available, not rendered). Add/remove updates the table. On `header_lines` instance lists the picker is header + platform fields (not line-only fields). Glossary Section/Entry use the same `EntityListing` toolbar (filter, picker, name search, drag-reorder).

Do not hide this behind a per-page `headerFilters` one-off (today Organizations only has “Filter by type”).

### 1.2 Active criteria

- Criteria render **below the toolbar, above the table, left-aligned**, one chip per criterion.
- Each chip has a small **×** to remove that criterion.
- Criteria **OR-combine by default** (Stephen QA 2026-09-08: "that or that or that, not and"); AND is not offered in v1.
- Matching is **case-insensitive "contains"** (substring) against the cell’s **raw value or displayed text** — picklists commit raw api values (e.g. `true`, org ids) while cells may render labels (Yes/No, org names), so either side matches. Typed values match raw or displayed text the same way.
- Removing a **column** from the picker **also removes** any chips for that column.

### 1.3 Columns vs secrets

- Filter’s column picklist = columns **currently rendered**.
- Columns picker = all non-secret catalog fields for the listing (ERD), including those not shown by default. Secrets / Configuration stay out.
- Persisted visible set (`columnStorageKey` / `usePersistedColumnOrder` with `visibility: true`) must not drop extra keys or re-append hidden defaults on reload.
- Secret fields stay masked; they are not filter/search targets.

### 1.4 Persistence

- Visible columns: keep the existing per-table storage key.
- Active filters and search: session is enough for v1 unless the same key can hold them without breaking old payloads. Do not invent a second storage scheme without a note here.

---

## 2. Current State

### 2.1 Why

Stephen (2026-09-08 IDE): enhance the Organizations-style filter, put it on all backend tables, add faceted criteria + column picker + name search.

### 2.2 Behavior today vs contract

| Piece | Today |
|-------|--------|
| Filter | Shared toolbar on every `EntityListing`. Column picklist = currently rendered, non-secret columns. |
| Columns | Picker lists all non-secret ERD fields; default visible = `column !== false`. Drag-reorder headers. |
| Search | Name-column contains, same toolbar. |
| Criteria chips | OR-combine, contains, × / Clear all. |
| Glossary Section/Entry | `EntityListing` (0.7.158) — same toolbar as Organizations. |

### 2.3 Code anchors

- `src/components/listing/entity-listing.tsx` — shared table + toolbar; picker = `!secret`; filter = visible ∩ columnable
- `src/components/settings/records-table.tsx` — `usePersistedColumnOrder(..., { catalog, visibility })`
- `src/components/organizations/organizations-panel.tsx` — `listingFieldsFromCatalog("organization")`
- Zone listings via `src/components/zones/zone-config-view.tsx` (header+platform on instances; extras `column: false`)
- `src/app/glossary/page.tsx` — Section/Entry `EntityListing`

---

## 3. Target State

§1 on every backend `EntityListing`. Organizations type filter is one chip (column = type) that the user can add/remove, not a unique snowflake.

---

## 4. Backlog / Plan (WBS)

| ID | Deliverable | Depends | Agent verify | QA | Status | Task ID |
|----|-------------|---------|--------------|-----|--------|---------|
| WU-01 | Shared toolbar on all backend `EntityListing` tables; replace one-off `headerFilters` | — | ✅ | ✅ | ✅ done 2026-09-08 | 283 |
| WU-02 | Faceted filter: column picklist → value picklist or typed value → Add → chips with × | WU-01 | ✅ | ✅ | ✅ done 2026-09-08 | 284 |
| WU-03 | Column visibility multi-select; picker = full ERD, not only default-visible | WU-01 | ✅ | ✅ | ✅ done 2026-09-08; catalog-complete 0.7.158 | 285 |
| WU-04 | Record-name search on each table | WU-01 | ✅ | ✅ | ✅ done 2026-09-08 | 286 |
| WU-05 | Glossary Section/Entry on shared EntityListing toolbar (filter, columns, search, reorder) | WU-01 | ✅ | ✅ | ✅ done 2026-09-08 | 282 |

---

## 5. Results Feedback

| Date | Scenario | Result | Follow-up |
|------|----------|--------|-------
| 2026-09-08 | WU-02 typed-value criteria + matcher fix on :3200 (0.7.152) | tsc 0; eslint 0 warnings (1 pre-existing set-state-in-effect error untouched); build ok; catalog E2E 34/34; browser E2E 17/17 (boolean chip 36→1 rows, typed chip via Enter narrows to 1, ×-removal, Clear all, rows restored) | QA on :3200 pending (Stephen) |----|
| 2026-09-08 | WU-01 build gates | tsc 0; scoped eslint clean (1 pre-existing set-state-in-effect error on title-reset effect, untouched); E2E 34/34 on :3200 | QA on :3200 pending (Stephen) |
| 2026-09-08 | 0.7.158 Glossary + full-ERD Columns picker | tsc 0; pre-existing set-state-in-effect only; build ok; :3200 health 0.7.158. E2E: Glossary Section/Entry have Filter+Columns+Search; org picker = 11 ERD fields (default 4); Tasks picker = header+platform (no subtask line fields); audit columns default-hidden | **QA passed** — Stephen “Looks perfect.” 2026-09-08 |

---

## 6. Change Log

| Date | Change | Items |
|------|--------|-------|
| 2026-09-08 | Extracted from Stephen IDE brief. Not built. | WU-01…04 tasked |
| 2026-09-08 | WU-01 shipped: shared criteria-chip toolbar inside EntityListing (select/boolean columns); Organizations one-off type filter retired — now a chip via the shared toolbar. Typed-value criteria (WU-02), column picker (WU-03), name search (WU-04) still open. | #283 |
| 2026-09-08 | WU-02 shipped as 0.7.152: second stage is picklist (select-with-options, boolean) or typed input (all other rendered non-secret columns; Enter commits); matcher now matches raw value OR displayed text (fixes is_person true-vs-Yes and parent-id-vs-name never matching); boolean picklist + chips show Yes/No; Add disabled until value; typed values trimmed; lint cleanups (unused Badge import, activeSort memoized). | #284 |
| 2026-09-08 | Stephen QA on 0.7.151: (1) Filter button made prominent (brand fill, white text); (2) matching switched exact → case-insensitive contains; (3) criteria combine OR by default; (4) WU-03 column picker + WU-04 name search built same cycle (0.7.154). Picker binds to persisted visible set (min 1 column; hiding a column drops its chips — verified); name search = name-column contains, combined with criteria. E2E: OR 36→3 rows, contains rim→1, search Primary→1, hide/restore headers 5/4/5. | #285 #286 |
| 2026-09-08 | 0.7.158: Columns picker lists every non-secret ERD field (not only `column !== false`); Filter stays on rendered columns. Persist visibility no longer strips extra keys or re-appends hidden defaults. Glossary Section/Entry moved onto EntityListing. Organizations listing fields from catalog (slug, notes, audit, …). | #282 #285 |
| 2026-09-08 | Stephen QA: “Looks perfect.” WU-01–WU-05 closed. Promoted `beta` → `master` at 0.7.158. | #282 |
