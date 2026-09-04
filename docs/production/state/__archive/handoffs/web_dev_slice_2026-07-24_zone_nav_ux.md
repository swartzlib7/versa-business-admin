# Web-Dev Slice: Zone nav UX stability + cross-page layout consistency

**Author:** COA  
**Date:** 2026-07-24  
**Branch:** `agent/web-dev` — rebase from current `beta` (`b289015` or newer)  
**Three-gate:** Web-dev delivery → COA quality review → Stephen full check  
**Version bump:** 0.7.54  

## Context (Stephen 2026-07-24)

Port 3100 / blank Chrome issue is **closed** (Firefox + Chrome both work after hard refresh).  
Stephen reported **Zone UX regressions** after the sticky layout work (#195 / b55fa05). Treat this as the next explicit coding slice — prior standby-until-full-check hold is lifted for **these** items only.

### Reported bugs

1. **~150px blank band** at top of Zone pages pushing content down.
2. **Overlap** on the top-right Zone actions (Show/Hide Twin, Full 3D hub, accent chip) — likely the sticky tab row colliding with the sticky header row.
3. **Header/description jump on sub-tab change** (critical UX):
   - Path: Organization → **Executive** → Configuration  
   - See "Executive" heading + description ("Business executive function — …")  
   - Click **Policy** (next to Configuration)  
   - Heading + description **disappear**; tab row **shifts up**.  
   - Must not happen for any menu / sub-tab navigation.

### Product direction (Stephen)

- **Stable chrome** for all related menu navigation — positions must not jump when switching tabs or sub-tabs.
- **Remove repeated primary-section heading** inside sub-tabs (do not re-title the faculty as a big heading that mounts/unmounts per child).
- **Keep a description** for the active sub-tab; **add a description for every sub-tab** (Configuration, Policy, Projects, Tasks, and the same pattern everywhere).
- **Records Editor:** mandatory **description** field when adding/editing a record type.
- **Same layout pattern** for **Glossary**, **Users**, and **Settings** — consistency at all costs.

---

## Root cause notes (COA)

File: `src/components/zones/zone-config-view.tsx`

1. **Sticky collision**  
   - Zone title block: `sticky top-14` (assumes ~one title row).  
   - Primary tabs: `sticky top-[5.5rem]` (only ~32px under header).  
   - Real title block is taller (badge + h1 + subtitle + action buttons, often wraps on lg:flex-row). Tabs stick too high → **overlap** and awkward empty/gap feel (~150px class symptoms).

2. **Unmounting faculty chrome on child change**  
   - `FormPanel` renders `CardTitle` = faculty / "Faculty · Child".  
   - Listing children (`Policy`, etc.) use `ListingPanel` **without** the same parent header stack.  
   - Switching Configuration → Policy **removes** the visible "Executive" heading + summary → tab strip jumps up. Matches Stephen's repro exactly.

3. **Cross-page drift**  
   - Zones use custom sticky header in `ZoneConfigView`.  
   - Settings uses `PageHeader` + `SectionTabs` (`top-14` / `top-[5.5rem]`).  
   - Glossary / Users use `PageHeader` only (different structure).  
   - Need one shared shell pattern.

---

## Scope

### A. Stable Zone chrome (Organization / Collaboration / Environment)

**Do:**

1. Replace dual independent stickies with **one sticky chrome stack** under the app header:
   - Row 1: zone identity (dot, badge, **zone** title e.g. Organization, zone subtitle) + actions (Full 3D hub, Show/Hide Twin, accent chip).
   - Row 2: **primary element tabs** (Executive, Public, …) immediately under row 1, same sticky container (or sticky sibling whose top equals measured/row1 height — prefer **single parent sticky** so offsets cannot desync).
2. Eliminate the large unexplained top blank; main padding should match Settings/Users (AppShell p-4 lg:p-6 only — no double spacer).
3. Ensure Show/Hide Twin and siblings are **never covered** by the tab row (z-index + layout; actions stay in row 1).
4. Primary tabs and zone title **must remain mounted** when switching primary tabs **and** when switching nested sub-tabs (Configuration / Policy / …).

**Nested sub-tabs (Configuration, Policy, Projects, Tasks, …):**

5. Keep sub-tab strip in a **stable** place (recommended: top of the content column, directly under primary tabs — not inside a card that is replaced by a different component tree height).
6. **Remove** repeated primary-section **heading** inside sub-tab bodies (no big "Executive" / "Executive · Policy" title that appears only on some children).
7. **Always show** the active sub-tab **description** (`summary` today) under the sub-tab strip or as the only text header for the panel.
8. Every sub-tab must have a non-empty description:
   - Use existing `summary` where present.
   - Add missing summaries in `src/lib/zones/zone-definitions.ts` (and any dynamic record-type tabs) for Configuration + all children across org/collab/env.
9. Listing vs form panels may differ in **body** only — not in whether chrome/description exist.

### B. Records Editor — mandatory description

File: `src/components/settings/records-editor.tsx` (+ types/API if persisted).

10. Add **Description** as a **required** field on create/edit record type.
11. Validate empty description (UI + server/schema if applicable).
12. Surface description in zone UI where record types become tabs (tab description / panel summary).

### C. Glossary + Users + Settings — same layout language

13. **Settings:** keep PageHeader + SectionTabs but fix sticky stack the same way as Zones (one stack, no overlap, no jump when changing Appearance/Records/etc.).
14. **Users:** adopt the same header + optional tabs pattern if multi-section; at minimum same PageHeader spacing/sticky behavior as Settings.
15. **Glossary:** primary section + sub-tabs using the **same** visual/layout components as Zones/Settings (shared PageHeader / SectionTabs or a thin SectionShell wrapper). Sections already exist in data — wire sub-tabs consistently; each sub-section shows its description.

Prefer extracting a small shared component if it reduces drift, e.g. SectionShell { title, subtitle, actions, tabs, children } with one sticky implementation — only if it stays lean.

### D. Out of scope

- New features beyond layout/description consistency  
- 3D twin behavior changes (except not breaking Show/Hide Twin)  
- Auth / blank-page work (done)  
- Re-opening family/Sylvie tasks  

---

## Acceptance checklist

- [ ] Organization → Executive → Configuration → Policy: **no** vertical jump of primary tabs; zone title row stays put.
- [ ] No ~150px empty band at top of Zone pages.
- [ ] Show/Hide Twin / Full 3D hub / accent chip fully clickable, not covered.
- [ ] No repeated faculty **heading** inside sub-tab panels; **description** visible for every sub-tab.
- [ ] All zone-definitions (static) sub-tabs have descriptions; dynamic record types require description in Records Editor.
- [ ] Glossary, Users, Settings match the same header/tab layout language.
- [ ] pnpm lint / build clean for touched files; bump package + health to **0.7.54**.
- [ ] Commit on agent/web-dev, push; reply to COA with commit hash + test notes.

## Repro / verify

1. Open http://192.168.4.107:3100/organization (logged in)
2. Executive → Configuration — note positions of zone title, primary tabs, sub-tabs, twin buttons
3. Click Policy, Projects, Tasks — chrome must not jump; descriptions update; no extra faculty H1
4. Toggle Show/Hide Twin — no overlap
5. Repeat spot-check Collaboration + Environment
6. Settings tabs, Users, Glossary — same stability

## Git

```bash
git fetch origin
git checkout agent/web-dev
git reset --hard origin/beta   # or rebase onto beta b289015+
# ... implement ...
git commit -m "fix(I5.6): stable zone chrome, sub-tab descriptions, layout consistency (0.7.54)"
git push -u origin agent/web-dev
```

**Do not merge to beta** — COA reviews then merges after Stephen check.
