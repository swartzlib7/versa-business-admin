# Alignment checklist — Mission Control (updated 2026-07-18)

Use before accepting any new Mission build slice.

**ERD source of truth:** `docs/production/state/state_i5_6_zone_erd.md`  
**Map:** `docs/production/state/shape_business_admin.md`

## Boundaries

| # | Requirement | Spec / plan status | Build status |
|---|-------------|--------------------|--------------|
| 1 | Own database + ERD | PRODUCT_SPEC 1.1; keystone conceptual ERD | Fixture/API only — SQL DB TBD |
| 2 | Secure login + RBAC | PRODUCT_SPEC | **Done** (I5) |
| 3 | Public FE when signed out | Spine §A | **Done** (I4/I5.x) |
| 4 | Prefer pre-built secure components | Path A locked | Ongoing |
| 5 | Familiar business UI — not agent-management chrome | Boundary locked 2026-07-18 reinforced | **Mostly done** — ensure Agents nav stays gone; no new agent chrome |
| 6 | Users and agents differ only by type | **Locked** — agents = user type only | **Done** in users model |
| 7 | Product data separate from host Versa AGi | Boundary locked | Adapter portable/API-based |
| 8 | Host integration only via product API / Script Tasks | Boundary locked | API contract exists |
| 9 | agitop Organization optional; migration out of scope | Keystone §2 | **Document** in system information (not built) |
| 10 | No Active Agents / Agent Status in product | Keystone nav remap | Enforce on I5.5 nav pass |

## Capability spine

| # | Capability | Spec | Build |
|---|------------|------|-------|
| A1–A4 | Public business / services / products / staff | PRODUCT_SPEC | **Done** |
| B1 | User login | PRODUCT_SPEC | **Done** |
| C1 | Users (type human \| agent) | PRODUCT_SPEC | **Done** |
| C2 | Roles | PRODUCT_SPEC | **Done** |
| C3 | Projects | PRODUCT_SPEC; under Executive | **Done** (I6); nav home pending I5.5 |
| C4 | Tasks | under Executive/Projects | **Done** (I6); nav home pending I5.5 |
| C5 | Organization departments (keystone spheres) | Keystone | 3D transitional fixture only; keystone nodes **not** built |
| C6 | Collaboration parties | Keystone | Not built (labels only after I5.5) |
| C7 | Environmental entities | Keystone | Not built |
| C8 | Product → Integrations | Keystone | Integrations exist as legacy surface; remap pending I5.5 |
| C9 | Knowledgebase depth | PRODUCT_SPEC | Not started |
| C10 | System information (agitop boundary) | PRODUCT_SPEC §10 | Not started |
| 3D | Keystone spatial ERD | Keystone | I5.4/I5.4.1 transitional graph on beta |

## Path & competition

| Item | Status |
|------|--------|
| Path A: Next.js + OSS components | **Locked** 2026-07-16 |
| Competitors: ERPNext, Odoo | Registered on project #26 |
| QA agent | Deferred |
| I7 | **Closed** until Stephen opens |
| I5.5 | **Not opened** — implement keystone when Stephen asks |

## Doc audit (2026-07-18)

| Doc | Status |
|-----|--------|
| MISSION_CONTROL_ERD_KEYSTONE.md | v1.1 current |
| PRODUCT_SPECIFICATION.md | Updated 2026-07-18 |
| PRODUCTION_PLAN.md | Updated 2026-07-18 |
| ALIGNMENT_CHECKLIST.md | This file |
| LAYOUT_PROPOSAL.md | Superseded banner added |
| README.md | Updated |
| Historical ITERATION_* handoffs | Historical — do not treat I5.4 graph as final ERD |

---

*End of alignment checklist.*
