# Iteration 5.5.1 — Exact 3D positions (z-axis) vs from_stephen_02

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Depends on:** I5.5 on beta (`8c37ba9`); audit `docs/_notes/I5_5_EXACT_AUDIT.md` (`ba66726`)  
**Date:** 2026-07-18  
**Branch:** `agent/web-dev` (sync from `origin/beta` first)  
**Model:** same as COA (`x-ai/grok-4.5`) — already set  

## Why this pass exists

Stephen confirmed the 3D element is **not** a single-layer disc. Positions in parentheses in `docs/_notes/from_stephen_02.md` are binding:

- **(top)** / **(bottom)** ⇒ non-zero **Y** (vertical axis in R3F)
- **(front)** / **(back)** / **(left)** / **(right)** ⇒ XZ compass
- Executive **(center)** among Organization spheres — **not** equal-spaced on the org ring

COA audit: current `computePositions()` uses equal θ and **y=0 for every node** → **FAIL** on semantic layout. Lightbox, billboards, nav remap, node inventory = keep.

## Source of truth (read in order)

1. `docs/_notes/from_stephen_02.md`  
2. `docs/_notes/I5_5_EXACT_AUDIT.md`  
3. `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` v1.1  

## Required code changes

### 1. Explicit positions (mandatory)

Replace equal-angle disc in `src/components/r3f/mission-control-scene.tsx` `computePositions()`.

**Preferred:** add optional `position?: [number, number, number]` (or semantic slot) on fixture nodes in `business-graph.ts` and read those in the scene.

**Suggested semantic map** (tune radii to stay readable; Y up):

| id | Zone | Intent | Suggested local pose |
|----|------|--------|----------------------|
| hub | brand | center | `(0, 0, 0)` |
| executive | org | center among org | `(0, 0.15, 0)` small offset from hub — **not** full ring radius |
| communications | org | left of center | `(-1.2, 0.1, 0)` |
| dissemination | org | right of center | `(1.2, 0.1, 0)` |
| treasury | org | back | `(0, 0.1, -2.2)` |
| production | org | front | `(0, 0.1, 2.2)` |
| qualification | org | **bottom** | `(0, -1.3, 0.4)` |
| vendor | collab | right | `(r2, 0.2, 0)` |
| customer | collab | front | `(0, 0.2, r2)` |
| partner | collab | left | `(-r2, 0.2, 0)` |
| branch | collab | back | `(0, 0.2, -r2)` |
| locations | env | left | `(-r3, 0.35, 0)` |
| events | env | right | `(r3, 0.35, 0)` |
| knowledge | env | back | `(0, 0.35, -r3)` |
| schedules | env | front | `(0, 0.35, r3)` |
| product | env | **bottom** | `(0.8, -1.6, 0.6)` |
| service | env | **top** | `(-0.8, 1.8, 0.6)` |

Use `r2 ≈ 4.2`, `r3 ≈ 6.2` or keep RING_RADII guides. Orbital ring guides may remain as zone hints; nodes **may leave the disc**.

### 2. Keep (do not regress)

- Lightbox expand (not F11)  
- Billboard labels  
- Organization rim label  
- Versa AGi hub name on scene  
- Nav Executive / Product  
- No Active Agents KPI  

### 3. Optional if cheap

- In-app Glossary page or Settings section copying keystone §6 terms  
- Redirect `/agents` → `/users?type=agent`  

### 4. Out of scope

- I7 hierarchy  
- Own SQL DB  
- Full per-zone CRUD UIs  

## Acceptance

1. Visual/orbit inspection: Service clearly **above**, Product & Qualification clearly **below**, Executive near center, collab/env match compass.  
2. Audit table in `I5_5_EXACT_AUDIT.md` items 5–7 flip to PASS (update audit or add short ACCEPT note).  
3. `npm run build` clean; smoke on **one** agreed port.  
4. Commit on `agent/web-dev`; notify COA with commit hash — COA merges to beta.

## Ports note (for your smoke)

Do not leave orphan `next dev` on random ports. Prefer: stop stale servers, then from synced tree `npx next start -p 3100` after build (or one documented dev port). 3100/3101 both answering is process sprawl, not a Next feature.

I7 remains **closed**.
