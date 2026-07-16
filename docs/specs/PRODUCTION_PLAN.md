# Production Plan — Versa AGi Mission

**Project ID:** 26 (`versa-admin-system`)  
**Game:** #109 Versa Voice AI LLC  
**Created:** 2026-07-14  
**Updated:** 2026-07-16  
**Status:** I0+I1+I2 accepted. Path **A locked**. I3 = document rewrite to capability spine (this pass). Next = first build slice on spine.

**Product framing:** Client **mission control** — public website + login + backend (users/roles/projects/tasks/org/KB). **Not AGI Top. Not a full ERP.** White-label. Own DB/ERD. API for UI + Versa AGi agents.

**Competitors (Game opponents on #26):** ERPNext, Odoo — category frame only; we build path A.

---

## Document alignment (2026-07-16) — I3

Stephen note (`docs/_notes/from_stephen.md`) + capability spine are **binding**.

I3 deliverable (COA):
1. Rewrite PRODUCT_SPEC, this plan, API_CONTRACT, ALIGNMENT_CHECKLIST to spine language.
2. Retire host-agent-fleet-first iteration backlog.
3. Propose first **build** slice only after docs land (I3b / I4 naming as needed).

---

## 1. Division of Ownership

| Area | Owner | Notes |
|------|-------|-------|
| Product vision & distribution into Versa AGi | **Stephen** | Packaging, install path, host contracts, remotes |
| Planning, prioritization, acceptance | **COA (Versa)** | Specs, iteration design, task orchestration |
| Implementation | **web-dev** | Next.js / shadcn / R3F build |
| Quality / regression | **QA agent (when hired)** | Test plans, E2E, acceptance checks |
| Architecture of *this host's* AGi core | Out of scope | Product stays standalone |

---

## 2. Team Model

| Role | Agent | Model | Status |
|------|-------|-------|--------|
| Orchestrator / PM | coa | Strong reasoning | Active |
| Developer | web-dev | deepseek/deepseek-v4-pro | Active; standing by for next slice |
| Tester | qa (role `qa`) | deepseek/deepseek-v4-flash | **Deferred** until testable UI on spine |
| Research (ad hoc) | researcher | Flash | Only if needed |

**QA:** Stephen green-lit hire when needed (2026-07-16). COA will not onboard until there is UI worth independent verification. Proposed names later: Prism, Gauge, Verity, Beacon.

---

## 3. Iteration history

| Iter | Focus | Status |
|------|--------|--------|
| I0 | Next.js + React + R3F seed + fixture API | Accepted |
| I1 | Shell polish + API contract + 3D→2D | Accepted |
| I2 | Agent API depth + operational Agents surface | Accepted (seed; language to reframe) |
| **I3** | **Doc/language pass → capability spine + path A** | **In progress (this commit)** |
| I4+ | Build slices along spine (see §4) | Planned |

Git: `git@github.com:swartzlib7/versa-agi-mission.git`  
Branches: `master`, `beta`, `agent/coa`, `agent/web-dev`  
Workflow: product work on `agent/*` → clean merge to `beta` → Stephen promotes to `master`.

---

## 4. Forward iteration plan (capability spine)

### I3 — Document alignment (COA) — current

- [x] Path A locked with Stephen  
- [x] ERPNext + Odoo as competitors  
- [ ] PRODUCT_SPEC / PRODUCTION_PLAN / API_CONTRACT / ALIGNMENT_CHECKLIST rewritten  
- [ ] Commit + push `agent/coa`; notify web-dev to pull  
- [ ] Propose I4 first build slice  

### I4 — Public site foundation (recommended first build)

**Owner:** web-dev → COA smoke  

- Public layout (header / body / footer)  
- Business profile fields (name, slogan, logo, description) from product data/fixtures  
- Service list + product list public pages  
- Staff structure public view (people + roles; no agent chrome)  
- Keep existing app shell behind auth boundary (even if auth still stubbed, route split public vs app)  
- Reframe any remaining Agents nav labels toward Users/People  

### I5 — Auth + RBAC skeleton

- Secure login facility (real session, not forever placeholder)  
- Roles model + permission checks on backend routes  
- Users CRUD with `type`: `human` | `agent`  

### I6 — Work surfaces

- Projects + Tasks as business entities (own ERD)  
- Tables/filters; API parity  

### I7 — Organization structure

- Hierarchy: divisions → departments → sections → units  
- Tree UI; assign people to nodes  

### I8 — Knowledgebase

- Policies, Processes, Articles  
- Assignable to org-structure elements  
- Rich text via OSS component  

### Later

- Own DB persistence (replace fixtures)  
- White-label settings depth  
- Optional R3F business graph over spine entities  
- Host packaging hooks (Stephen)  
- Product API hardening for Script Task integration  

---

## 5. How We Run This in Versa AGi

1. **Project #26** is the single source of truth for files and tasks.  
2. **web-dev** assigned; works on `agent/web-dev`.  
3. **COA** defines slices + acceptance; accepts before next build task.  
4. **Internal messages** for agent handoffs; Stephen gets milestone summaries.  
5. **Building-phase rules:** setup/purge rebuild from zero.  
6. **No full ERP evaluation** unless Stephen reopens path B.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope expands into full ERP | Spine locked; COA gates non-spine asks |
| Seed UI still reads as agent console | I4 reframe labels + users model |
| R3F distracts from spine | R3F optional; not I4–I8 blocking |
| web-dev SSH key not on GitHub | Works via COA workspace symlink; deploy key optional |
| Premature QA hire | Defer until testable public/backend slices |

---

## 7. Decisions log

| Date | Decision |
|------|----------|
| 2026-07-15 | QA flexible; React+R3F; API for agents |
| 2026-07-16 | Binding boundaries note |
| 2026-07-16 | Capability spine (public → login → backend) |
| 2026-07-16 | Path A: Next + OSS components |
| 2026-07-16 | Competitors: ERPNext, Odoo |
| 2026-07-16 | QA not onboarded for doc pass |

---

## 8. Next actions

1. Finish I3 doc commit on `agent/coa` and push.  
2. Brief web-dev: pull origin, no feature work until I4 task.  
3. Open I4 task with acceptance criteria after push.  
