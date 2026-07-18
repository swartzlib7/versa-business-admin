# I5.5 Exact Audit vs `from_stephen_02.md` + Keystone v1.1

**Date:** 2026-07-18  
**Branch audited:** `beta` @ `00db655` (includes I5.5 feat `8c37ba9` + docs accept + Stephen notes)  
**Sources:** `docs/_notes/from_stephen_02.md`, `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` v1.1  
**Code:** `src/lib/fixtures/business-graph.ts`, `src/components/r3f/mission-control-scene.tsx`, `src/app/dashboard/page.tsx`, `src/components/shell/sidebar.tsx`, `src/lib/theme.ts`  
**Auditor:** Versa (COA)

---

## Verdict

**I5.5 is partially accurate — not an exact match to Stephen’s write-up.**

What landed well: zone model, node inventory, brand rename on the 3D hub, lightbox expand, billboard labels, Organization rim label, nav remap (Executive / Product), Active Agents KPI removed from dashboard chrome, system-info blurb present.

**Critical gap:** node placement is still a **flat equal-angle disc** (`y = 0` for every node). Stephen’s parenthetical positions — especially **(top)** / **(bottom)** and **center among org spheres** — require a **true Z-axis / vertical layout**, not equal spacing on a single plane. That is the main accuracy failure of this pass.

---

## Checklist vs `from_stephen_02.md`

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|----------------|
| 1 | Expand toggle → lightbox, more full-screen, **not** F11 | **PASS** | Dashboard Expand control + fixed overlay `max-h-[90vh]`; no `requestFullscreen` |
| 2 | Labels always point to camera | **PASS** | `<Billboard>` on hub, zone nodes, Organization rim label |
| 3 | `Organization` center circle zone + flat label on edge | **PARTIAL** | Rim label exists (`OrganizationRimLabel`). Org nodes sit on ring 1 around brand hub; brand hub is center, not “Organization as center zone” as a distinct geometric treatment beyond the rim label |
| 4 | `Versa AGi` replaces `Northstar Works` (authenticated viz) | **PARTIAL** | `theme.scene.hubName = 'Versa AGi'` — **PASS for 3D**. Shell/sidebar/public still `theme.brand.name = 'Northstar Works'` (white-label / public sample — keystone allows public Northstar; shell brand may still confuse) |
| 5 | Org departments: Executive **(center)**, Communications **(left of center)**, Dissemination **(right of center)**, Treasury **(back)**, Production **(front)**, Qualification **(bottom)** | **FAIL** | `computePositions()` places all ring nodes with equal θ and **y=0**. Executive is on the ring at θ=-90°, not center among org spheres. Qualification is not below the plane. No semantic compass mapping |
| 6 | Collaboration: Vendor **(right)**, Customer **(front)**, Partner **(left)**, Branch **(back)** | **FAIL** | Same equal-angle disc; order in fixture ≠ Stephen compass (vendor first → back-ish, not right) |
| 7 | Environmental: Locations **(left)**, Events **(right)**, Knowledge **(back)**, Schedules **(front)**, Product **(bottom)**, Service **(top)** | **FAIL** | Equal-angle disc; **Service (top)** and **Product (bottom)** cannot be expressed with y=0 |
| 8 | Glossary of Terms | **DOCS ONLY** | Full glossary in keystone §6. **No in-product Glossary UI** (Stephen asked to add one) |
| 9 | Nav: Integrations → Product; Projects/Tasks → Executive; Settings/Users/Dashboard as-is | **PASS** (nav) | `sidebar.tsx` groups Executive→Projects/Tasks, Product→Integrations |
| 10 | Active Agents / Agent Status fall away | **PARTIAL** | Sidebar/KPI no longer show Active Agents. **Legacy routes remain:** `src/app/agents/*`, `/api/agents*` (deprecated aliases). Not linked in main nav, but still reachable |
| 11 | Three-zone conceptual ERD | **PASS** (data model) | Fixture types `brand \| organization \| collaboration \| environmental`; rings 0–3 |
| 12 | UI pattern per zone (configure + cross-zone) | **OUT OF SCOPE / not built** | Keystone §3.5 — conceptual; I5.5 did not claim full zone UIs |

---

## Position math (current implementation)

```ts
// mission-control-scene.tsx — computePositions()
const theta = (i / count) * Math.PI * 2 - Math.PI / 2;
positions.set(node.id, [cos(theta)*r, 0, sin(theta)*r]); // y always 0
```

Computed positions (Three.js: X right, Y up, Z toward/away):

### Ring 1 Organization (r=2.8) — all y=0

| Node | θ | (x,y,z) | Stephen intent | Match? |
|------|---|---------|----------------|--------|
| executive | -90° | (0, 0, -2.8) | **Center** among org spheres | **No** — on ring |
| communications | -30° | (2.42, 0, -1.4) | Left of center | Weak / wrong frame |
| dissemination | 30° | (2.42, 0, 1.4) | Right of center | Weak / wrong frame |
| treasury | 90° | (0, 0, 2.8) | Back | Not guaranteed as “back” |
| production | 150° | (-2.42, 0, 1.4) | Front | No |
| qualification | 210° | (-2.42, 0, -1.4) | **Bottom** | **No** — needs −Y |

### Ring 2 Collaboration (r=4.8) — all y=0

| Node | Current | Stephen |
|------|---------|---------|
| vendor | (0,0,-4.8) | **Right** |
| customer | (4.8,0,0) | **Front** |
| partner | (0,0,4.8) | **Left** |
| branch | (-4.8,0,0) | **Back** |

### Ring 3 Environmental (r=6.8) — all y=0

| Node | Current | Stephen |
|------|---------|---------|
| locations | (0,0,-6.8) | **Left** |
| events | … | **Right** |
| knowledge | … | **Back** |
| schedules | … | **Front** |
| product | … | **Bottom** (−Y) |
| service | … | **Top** (+Y) |

**Conclusion:** The scene has depth in the camera sense (orbit around a disc) but **not** the intentional vertical axis Stephen described. Parenthetical positions were ignored in favor of fixture array order + equal spacing.

---

## What *does* match (keep)

- Node set and labels for all three zones + Versa AGi hub  
- Department spheres (sphere meshes; org size 0.30)  
- Billboard labels  
- Lightbox expand (not browser fullscreen)  
- Organization rim label component  
- Nav remap Executive / Product  
- Departments KPI replaces Active Agents on dashboard  
- System information card (business MC vs agitop)  
- Fixture header documents keystone v1.1  

---

## Ports (3100 vs 3101) — why it looks strange

Next.js **does not permanently “change” the app’s port**. Each `next dev` / `next start` process binds the port you pass (`-p` / `--port`). Defaults:

| Script | Default |
|--------|---------|
| `next dev` / `next start` (package.json) | **3000** |
| Smoke / agent habit | often **3100**, **3101**, **3099**, **3300** |

**Observed on this host (2026-07-18):**

| Port | Process | Working tree |
|------|---------|----------------|
| **3100** | `coa` next-server | `/home/coa/coa-env/workspace/versa-admin-system` (COA smoke after I5.5 merge) |
| **3101** | listening (web-dev related) | separate bind — used in prior smoke notes as `:3101` |
| **3300** | `agi-web-dev` | `versa-admin-system-local` |
| **3099** | `agi-web-dev` | points at COA workspace path via next dev -p 3099 |

**Why broken site on 3100?** Common causes when multiple Next processes exist:

1. **Stale process** — old build still serving while `beta` moved on  
2. **Wrong tree** — web-dev local clone vs COA workspace  
3. **HMR / Turbopack conflict** — “Another next dev server is already running” (seen in `.logs/lan-dev.log`)  
4. **Port reuse** — you *can* reuse a port only after the previous process exits; two apps cannot share one TCP port  

**Recommendation:** Treat **one** port as the canonical preview for `beta` (e.g. kill stale servers, `npm run build && npx next start -p 3100` from the COA `versa-admin-system` on `beta`). Document that port in README; agents should not leave orphan `next dev` on random ports.

Ports are **reusable** after the listener stops. They “change” only because each smoke/dev session picks a free port when the preferred one is busy.

---

## Recommended fix pass (I5.5.1)

1. **Replace `computePositions()`** with an explicit position map (or fixture `position: [x,y,z]` / semantic slots):  
   - Org: Executive near center (small offset from hub, not full ring radius); Comm/Diss left/right of center; Treasury back; Production front; Qualification **below** (negative Y).  
   - Collab: compass on mid ring (Vendor +X, Customer +Z or agreed front, Partner −X, Branch −Z).  
   - Env: compass on outer ring + Service **+Y**, Product **−Y**.  
2. Keep rings as **guides** but allow nodes off the pure disc (true 3D constellation).  
3. Optional: slight Y banding per zone so Organization / Collaboration / Environmental read as layers.  
4. Add **in-app Glossary** (Settings or Help) sourced from keystone §6 — or link to keystone until UI exists.  
5. Soft-retire or redirect `/agents` pages to Users filtered by type (nav already clean).  
6. Align shell brand token for authenticated app if Stephen wants Versa AGi everywhere inside MC (keep Northstar for public sample only).  
7. Port hygiene: single documented preview port; stop orphan next processes.

---

## Collaboration completeness (Stephen asked)

from_stephen_02: Vendor, Customer, Partner, Branch — “check if I might be missing anything.”

Still reasonable optional parties (not blocking): **Employee/Contractor** (if not only Users), **Regulator/Authority**, **Community/Association**. Keystone already locked Branch = Subsidiary. No change required until Stephen wants more nodes.

---

## Sign-off

| Area | Score |
|------|-------|
| Data model / node inventory | Accurate |
| Nav remap | Accurate |
| Lightbox + billboards + rim label | Accurate |
| Brand on 3D hub | Accurate |
| **Semantic 3D positions (z-axis / top-bottom)** | **Not accurate — must fix** |
| Glossary in product | Missing (docs only) |
| Legacy agents routes | Residual |
| Port story | Process sprawl, not product bug |

**I5.5 should not be treated as exact acceptance against `from_stephen_02.md` until positions are explicit 3D.**
