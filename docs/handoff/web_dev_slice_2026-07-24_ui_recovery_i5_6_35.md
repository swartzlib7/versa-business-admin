# Handoff: I5.6.35 UI recovery — Twin static + Org chrome fixes

**Branch:** `dev/ui-recovery-2026-07-24` (from beta 0.7.54 / 204b762 + COA docs)  
**Assign to:** web-dev  
**QA reviewer:** COA then Stephen  
**Do not** merge to beta until COA verify.

## Stephen locked decisions (2026-07-24 evening)

1. **Twin window:** relevant element/zone only; **no animation**. Zoom levels stay as they are.
2. **Duplicate sub-heading (Organization):** text like *"Business executive function — default executive data, plus policy, projects, and tasks."* appears **twice**. **Remove the first (top)** instance. Codify as design pattern on **all pages** using this layout style.
3. **Sub-tabs missing:** primary still shows **Executive (4)** but sub-tab strip is gone — **restore** nested sub-tabs (Configuration + Policy / Projects / Tasks).

## Contract (statefold — read before code)

- `docs/design/spec/state/state_layout_mission_ui.md` § **I5.6.35**
- `docs/design/spec/state/state_i5_6_zone_erd.md` § **Twin + zone chrome — Stephen 2026-07-24 recovery**
- Prior review: `docs/coa/UI_RECOVERY_REVIEW_2026-07-24.md`

## Implementation checklist

### A. Twin — all zone twins static
**File:** `src/components/zones/zone-config-view.tsx`

```ts
// REPLACE
const twinAnimSpeed = config.id === "organization" ? 1 : 0;
// WITH
const twinAnimSpeed = 0;
```

- Keep dashboard Speed control default 0 (`dashboard/page.tsx`) — no change required unless broken.
- Twin remains zone-framed (`cameraFitZone` / focused node) — do not expand to full hub on zone pages.
- Drawer show/hide + localStorage stay.

### B. Description once (drop TOP duplicate)
**Root cause (COA):** I5.6.34 renders `panel.summary` in TabPanel **above** the card **and** again inside `FormPanel` CardHeader (`panel.label` + `panel.summary`). Same summary string → double sub-heading. Listing path may also pass `summary` into `EntityListing` while TabPanel already showed it.

**Pattern (apply everywhere this stack appears):**
- **One** muted description for the active panel/tab.
- Prefer: stable slot **above** body **or** inside card header — **not both**.
- Stephen: remove the **first (top)** one when both exist → keep description in the card/listing header (or keep stable slot and strip FormPanel/EntityListing summary — pick one, be consistent, document in state § change log).

**Also audit:**
- `PageHeader` + page body that repeats the same subtitle
- Settings / Glossary / Users if they double the blurb under sticky header

### C. Restore sub-tabs when badge count > 0
**Files:** `zone-config-view.tsx` (`SubTabBar` / `TabPanel`)

- Badge on primary tab is `(t.children.length + 1)` — if children exist, `subTabs` must be non-null and **SubTabBar must paint**.
- Verify sticky chrome is not covering the strip (z-index / overflow / grid).
- Verify `childId` reset and Configuration self-tab (I5.6.9) still work.
- Manual: Organization → Executive → must see Configuration | Policy | Projects | Tasks (or current child set).

### D. Out of scope this slice
- New features, Records Editor schema, DB wrap
- Reverting whole 0.7.54 chrome unless needed to restore sub-tabs
- Committing directly to `beta`

## Verify before COA handback

1. Org / Collab / Env twins: **static** (no orbit).
2. Organization → Executive: **one** executive summary line; **sub-tabs visible**.
3. Executive → Policy (and back): no layout jump; sub-tabs remain.
4. Spot-check Collab + Env for same description-once pattern.
5. Settings/Glossary: no double subtitle if same layout style.
6. `pnpm` lint/typecheck as project usual; smoke :3100 if you rebuild.

## Git

```bash
git fetch origin
git checkout dev/ui-recovery-2026-07-24
git pull origin dev/ui-recovery-2026-07-24
# work, commit on this branch only
git push origin dev/ui-recovery-2026-07-24
```

Notify COA with commit hash + short smoke notes. Do not ping Stephen directly.
