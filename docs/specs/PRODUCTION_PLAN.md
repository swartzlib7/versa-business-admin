# Production Plan — Versa AGi Mission

**Project ID:** 26 (`versa-admin-system`)  
**Game:** #109 Versa Voice AI LLC  
**Created:** 2026-07-14  
**Updated:** 2026-07-18  
**Status:** Path **A locked**. Spine build through I6 + I5.x on **beta**. ERD keystone **v1.1** locked. **I5.5 COMPLETE** on beta `8c37ba9` (v0.7.0, 2026-07-18). **I7 closed.**

**Product framing:** Client **business mission control** — public website + login + backend (users/roles/work/zones). **Not agitop.** White-label. Own DB/ERD. API for UI + Versa AGi agents (via HTTP / Script Tasks only).

**Canonical ERD:** `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md`

**Competitors:** ERPNext, Odoo — category frame only.

---

## 1. Division of ownership

| Area | Owner | Notes |
|------|-------|-------|
| Product vision & distribution into Versa AGi | **Stephen** | Packaging, install path, host contracts, remotes |
| Planning, prioritization, acceptance | **COA (Versa)** | Specs, iteration design, task orchestration |
| Implementation | **web-dev** | Next.js / shadcn / R3F build |
| Quality / regression | **QA agent (when hired)** | Deferred until needed |
| Host AGi core architecture | Out of scope | Product stays standalone |

---

## 2. Team model

| Role | Agent | Status |
|------|-------|--------|
| Orchestrator / PM | coa | Active |
| Developer | web-dev | Active; standing by — **do not start I5.5/I7 until tasked** |
| Tester | qa | Deferred |
| Research (ad hoc) | researcher | Only if needed |

---

## 3. Iteration history (actual)

| Iter | Focus | Status | Notes |
|------|--------|--------|-------|
| I0 | Next.js + R3F seed + fixture API | Accepted | |
| I1 | Shell polish + API contract + 3D↔2D | Accepted | |
| I2 | Seed depth (legacy agent routes transitional) | Accepted | Reframed to users |
| I3 | Doc alignment to capability spine + path A | Accepted | |
| I4 | Public site foundation | Accepted | |
| I5 | Auth + RBAC + Users | Accepted | |
| I5.1–I5.3 | Public sample / facets / Mission Control template | Accepted on beta | Northstar public sample retained where intentional |
| I5.4 | 3D hub viz (transitional business graph) | Accepted | `a41a27e` / v0.6.0 |
| I5.4.1 | Clearer rings + system triangle (dark) | Accepted | `0bf3c58` |
| I6 | Projects + Tasks work surfaces | Accepted | Under future Executive nav home |
| **Keystone v1.1** | Organization / Collaboration / Environmental ERD | **Documented** | `MISSION_CONTROL_ERD_KEYSTONE.md` — not a build iter |
| **I5.5** | Implement keystone in 3D + nav remap | **Accepted** | `8c37ba9` v0.7.0 on beta |
| **I7** | Organization hierarchy UI (historical spine) | **Closed** | Do not start until Stephen explicitly opens |

Git: `git@github.com:swartzlib7/versa-agi-mission.git`  
Branches: `master`, `beta`, `agent/coa`, `agent/web-dev`  
Workflow: `agent/*` → clean merge to `beta` → Stephen promotes to `master`.

**Where briefs live:** `docs/handoffs/ITERATION_*_WEB_DEV.md` inside this repo — **not** the workspace folder root.

---

## 4. Forward plan

### Now (docs / direction)

- [x] ERD keystone v1.0 from Stephen redesign  
- [x] Keystone v1.1 — agents = user type; departments as spheres; Branch/Locations/Integrations/agitop boundary  
- [x] Stale doc audit (PRODUCT_SPEC, this plan, alignment, layout research, README)  
- [ ] Stephen fleshes Organization departments further  
- [x] Stephen opened I5.5 (2026-07-18: proceed with next iteration)  

### I5.5 — Keystone implementation (OPEN)

**Owner:** web-dev → COA smoke  

- Replace transitional I5.4 fixture graph (Sales/Accounting/Teams/Surfaces) with keystone zones/nodes  
- Organization departments as spheres; Collaboration + Environmental nodes  
- Versa AGi hub branding; Organization rim label  
- Lightbox expand (not F11); billboard labels  
- Nav remap: Projects/Tasks under Executive; Integrations under Product; remove Active Agents / Agent Status  
- System information blurb (product vs agitop)  
- Keep public Northstar-style sample separate unless Stephen says rebrand public too  

### I7 — Organization hierarchy (closed)

- Only if Stephen opens: deeper hierarchy under departments  
- Must remain business org structure — **not** agitop agent ops  

### Later

- Collaboration / Environmental 2D entity UIs  
- Own DB persistence  
- Locations map integration  
- White-label depth  
- Host packaging hooks (Stephen)  
- Optional agitop Organization migration tooling (out of scope now)

---

## 5. How we run this in Versa AGi

1. **Project #26** is the file/task source of truth.  
2. **web-dev** on `agent/web-dev`; COA accepts before next build task.  
3. Internal messages for handoffs; Stephen gets milestone summaries.  
4. **I7 and I5.5** require explicit open — standing by is correct.

---

## 6. Definition of done (slice)

- Matches handoff acceptance criteria  
- No agent-console chrome regressions  
- Beta merge only after COA smoke  
- Docs updated if behavior/nav changes  

---

## 7. Change log

| Date | Change |
|------|--------|
| 2026-07-16 | I3 spine plan |
| 2026-07-18 | Align to shipped I4–I6 + I5.x; keystone v1.1; I7 closed; I5.5 gated |

---

*End of production plan.*
