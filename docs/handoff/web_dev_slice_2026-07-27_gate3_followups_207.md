# Web-dev slice #207 — Gate 3 follow-ups (forms focus, rings 5-step, sample labels)

**Source:** Stephen msg `int_143df48dc9fd4489` (2026-07-27)  
**Parent:** #185 I5.6.32 dynamic records · continues #205/#206 line  
**Base:** `agent/web-dev` @ `b09c43a` (0.7.62) — stay on branch; do **not** merge beta  
**Target version:** **0.7.63**  
**Three-gate:** implement → COA Gate 2 on :3200 → Stephen Gate 3  

Stephen confirmed Glossary looks good (no Glossary chrome work). Three items only:

---

## A) Forms — single character then lose focus (BUG)

**Symptom:** Typing in create/edit forms accepts one character, then focus drops (cannot continue typing).

**Likely surfaces:** Records Editor `CreateForm` and expand-row editors in `src/components/settings/records-editor.tsx`; check Users New User and any Glossary create/edit fields if same pattern.

**Likely causes (fix, do not guess-ship):**
- Parent re-render remounting the form (unstable `key`, conditional unmount, list refresh on each keystroke)
- Controlled input reset (`value` rebound from stale props / reload after every `onChange`)
- Inline component identity / fields array + key anti-pattern

**Acceptance:**
- Can type full multi-character labels/descriptions in New Record Type, New Field, New Picklist, add-options, and system type relabel without focus loss
- No full form remount on each keypress; tsc + build clean

---

## B) Rings — extend opacity steps (25% and 10%)

**Current (I5.6.40 / #206):** `ringsMode: 'on' | 'half' | 'off'`
- on → opacity 1.0  
- half → `palette.ringGuideOpacity` (~0.5)  
- off → hidden  

**Stephen:** Rings On needs two more entries — **25%** and **10%**.

**Implement:**
1. Extend mode union, e.g. `'on' | '50' | '25' | '10' | 'off'` (or keep `'half'` as alias of 50 — prefer explicit `'50'` and migrate `'half'` → `'50'` for clarity).
2. Cycle order: **on → 50% → 25% → 10% → off → on**
3. Opacity map: on=1.0, 50=0.5, 25=0.25, 10=0.10, off=hidden  
   - Prefer fixed opacities over only `palette.ringGuideOpacity` so 25/10 are exact; half/50 may still use 0.5 constant.
4. Update labels/tooltips/button variants on:
   - `src/app/dashboard/page.tsx`
   - `src/components/r3f/mission-control-scene.tsx` (prop types, SceneContent, in-canvas chrome)
   - `src/components/zones/zone-config-view.tsx` if it passes ringsMode
5. No leftover `'half'` unless aliased; default remains `'on'`.

**Acceptance:** Five-step cycle visible in UI; rings render at ~100/50/25/10/hidden; tsc + build clean.

---

## C) Sample data — clean + `(fixed)` / `(db)` label prefixes

**Stephen:** Review and clean sample data so it makes sense with the current structure. He cannot tell fixed vs dynamic.  
**Prefix rules (display labels in UI lists/tables):**
- **`(fixed) `** — baked-in / system / code-fixture definitions that are not user-originated (e.g. `is_system: true` record types, catalog system fields, hard-coded fixture rows meant as platform defaults)
- **`(db) `** — DB-persisted or user-creatable / seed rows that represent mutable demo data (org sample content, demo projects, user-created types if any, value-set demo data that is “live” catalog)

**Scope (be practical):**
1. Inventory display labels for: Record Types, Fields, Picklists (+ options), and any Records Editor parent labels pulled from sample/fixture/seed.
2. Align names with current structure (faculty / collaboration / environment parents, structure list|header|header_lines) — remove or rename nonsense leftovers.
3. Apply prefixes on **display label** (not necessarily api_name). Prefer one helper e.g. `formatSampleLabel(label, kind)` used at API response or UI render so prefixes stay consistent.
4. `scripts/seed.mjs` + `src/lib/fixtures/*` (especially `record-types.ts`, catalog/value sets, users/org sample) — keep seed idempotent.
5. Do **not** rename api_names in a breaking way without mapping; labels only unless a row is clearly junk.

**Acceptance:**
- In Records Editor (and Settings lists where sample rows show), Stephen can scan and see `(fixed)` vs `(db)` immediately
- Sample set feels coherent with current Records Editor structure
- tsc + build clean; :3200 shows prefixes after refresh

---

## Out of scope
- Beta merge (COA after Gate 3)
- New UI intake beyond A/B/C
- Optional #205 nits (Fields Type column rename; UsersPanel viewHref) unless trivial while touching same files — still not required

## Deliver
1. Commit on `agent/web-dev`, version **0.7.63**, push origin  
2. Internal message to COA with commit hash + short test notes (forms repro fixed; rings cycle; where prefixes appear)  
3. Leave :3200 rebuild to COA Gate 2 unless you already have a dev port note

Refs: #207, #185, #205, #206, Stephen `int_143df48dc9fd4489`
