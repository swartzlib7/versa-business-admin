# Alignment checklist — Stephen note + capability spine (2026-07-16)

Use before accepting any new Mission build slice.

## Boundaries (`docs/_notes/from_stephen.md`)

| # | Requirement | Spec / plan status | Build status |
|---|-------------|--------------------|--------------|
| 1 | Own database + ERD | PRODUCT_SPEC 1.1 | Not started (fixture/API only) |
| 2 | Secure login + RBAC | PRODUCT_SPEC 1.1; plan I5 | **Done** — login flow, session, roles (admin/member) |
| 3 | Public FE when signed out | Spine §A; I4 complete | **Done** — public home page renders from fixture data |
| 4 | Prefer pre-built secure components | Path A locked | Ongoing |
| 5 | Familiar business UI — not agent-management chrome | Boundary locked | **Done** — sidebar reframed: Agents → Users |
| 6 | Users and agents differ only by type | Boundary locked | **Done** — staff + users fixtures use type: human \| agent |
| 7 | Product data separate from host Versa AGi | Boundary locked | Adapter design portable/API-based |
| 8 | Integration to host only via product API / Script Tasks | Boundary locked | API contract exists; host scripts later |

## Capability spine

| # | Capability | Spec | Build |
|---|------------|------|-------|
| A1 | Public business info (name, slogan, logo, description) | PRODUCT_SPEC 1.2 | **Done** — /api/public/business + hero section |
| A2 | Public service list | PRODUCT_SPEC 1.2 | **Done** — /api/public/services + services section |
| A3 | Public product list | PRODUCT_SPEC 1.2 | **Done** — /api/public/products + products section |
| A4 | Public staff structure | PRODUCT_SPEC 1.2 | **Done** — /api/public/staff + people section |
| B1 | User login | PRODUCT_SPEC 1.2 | **Done** — /login page, /api/auth/login, session cookie |
| C1 | Users | PRODUCT_SPEC 1.2 | **Done** — /api/users (list+detail), /users page, type filter |
| C2 | Roles | PRODUCT_SPEC 1.2 | **Done** — admin vs member; admin-only PATCH enforcement |
| C3 | Projects | PRODUCT_SPEC 1.2 | Fixture seed (auth-protected) |
| C4 | Tasks | PRODUCT_SPEC 1.2 | Fixture seed (auth-protected) |
| C5 | Organization structure (div→dept→section→unit) | PRODUCT_SPEC 1.2 | Not started |
| C6 | KB policies / processes / articles on org nodes | PRODUCT_SPEC 1.2 | Not started |

## Path & competition

| Item | Status |
|------|--------|
| Path A: Next.js + OSS components (not full ERP) | **Locked** 2026-07-16 |
| Competitors: ERPNext, Odoo | Registered on project #26 |
| QA agent | Deferred until testable spine UI |

**I5 status:** Complete — auth + RBAC skeleton built and verified. Commit 4722828 on agent/web-dev. Ready for acceptance.
