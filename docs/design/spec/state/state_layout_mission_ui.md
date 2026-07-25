# State: Mission UI layout (2D chrome + 3D hub)

> **Role:** Sole go-to for Mission Control shell layout direction (sidebar, header, 3D viewport, zone pages).
> **Product:** versa-admin-system · Project #26

| Field | Value |
|-------|-------|
| **Feature** | Application layout / IA chrome |
| **Status** | 🔧 In progress — keystone zones live; polish ongoing on I5.6 hub |
| **Last verified against code** | 2026-07-20 (routes: dashboard, users, projects, tasks, organization, collaboration, environment, glossary, settings, integrations) |
| **Primary code** | `src/app/**`, hub scene components, zone pages |
| **Former doc** | `docs/research/LAYOUT_PROPOSAL.md` (superseded seed) |

**Folded sources (2026-07-20):** `docs/research/LAYOUT_PROPOSAL.md` → `__archive/LAYOUT_PROPOSAL.md`.

---

## 1. Behavior / contract

### 1.1 Binding boundaries
- Business Mission Control — **not** agitop.
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

**Code:** `zone-config-view.tsx`, `mission-control-scene.tsx`, `dashboard/page.tsx`.

### Change log
| Date | Change |
|------|--------|
| 2026-07-22 | I5.6.31 shipped on beta — drawer + static/3D spheres |

## I5.6.32a — Main nav de-dupe (2026-07-22)

Sidebar top-level **Projects / Tasks / Products** removed. Access via Organization zone (Executive / Production). Deep-link routes remain. Favorites/shortcuts deferred.

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

