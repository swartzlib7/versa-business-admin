# State: Mission HTTP API Contract

> **Role:** Sole go-to for Versa AGi Mission product HTTP API behavior, implemented routes, and planned resources.
> **Product:** versa-admin-system (Mission Control) · Project #26 · Game #109

| Field | Value |
|-------|-------|
| **Feature** | Product HTTP API (`/api/*`) |
| **Status** | 🔧 In progress — fixture-backed spine; version string drift noted |
| **Last verified against code** | 2026-07-20 (routes under `src/app/api/**`; package `0.7.45`) |
| **Primary code** | `src/app/api/**`, fixture adapters |
| **Former doc** | `docs/api/API_CONTRACT.md` (stub → this file) |

**Folded sources (2026-07-20):** `docs/api/API_CONTRACT.md` content merged here; original path kept as pointer stub.

---

## 1. Behavior / contract

### 1.1 Product boundary
1. Own product resources — Mission ERD entities, not host Versa AGi tables.
2. Business language — prefer `users`, `roles`, `projects`, `tasks`, future org/collab/env entities.
3. Legacy `/api/agents*` is **deprecated naming** — transitional alias of users with `type=agent`. Do not expand agent-fleet semantics.
4. Same API for UI and host Versa AGi agents via HTTP (or Script Tasks), never shared DB.
5. Public endpoints open; backend mutations require session auth + RBAC (admin write, member read).

### 1.2 Conventions
- **Base path:** `/api`
- **Protocol:** HTTP JSON
- **Auth:** Session cookie (httpOnly). Public routes open.
- **List envelope:** `{ data: [...], count: N }`
- **Error shape:** `{ error: { code: ..., message: ... } }`
- **Status codes:** 200, 201, 400, 401, 403, 404, 500, 501
- **Filters:** unrecognized keys silently ignored. Common: `status`, `type`, `q`, `orgUnitId`, resource-specific filters.

### 1.3 Implemented routes (code inventory 2026-07-20)

| Method + path | Auth | Notes |
|---------------|------|-------|
| GET `/api` | open | Index + endpoint map |
| GET `/api/health` | open | Health; **reports package version `0.7.45`** |
| POST `/api/auth/login` | open | Session login |
| POST `/api/auth/logout` | session | |
| GET `/api/auth/session` | session | Session (contract historically said `/me` in target map — **implemented name is session**) |
| GET `/api/users`, GET `/api/users/{id}` | session | `type`: human | agent |
| GET `/api/agents`, GET `/api/agents/{id}` | session | **Deprecated** alias |
| GET `/api/projects`, GET `/api/projects/{id}` | session | Business projects |
| GET `/api/tasks`, GET `/api/tasks/{id}` | session | Work items; filters status/projectId/priority/assignee/q |
| GET `/api/integrations` | session | Optional seed; not spine MVP |
| GET `/api/public/business` | open | |
| GET `/api/public/services` | open | |
| GET `/api/public/products` | open | |
| GET `/api/public/staff` | open | |
| GET `/api/public/knowledge-articles` | open | Public sample facet |
| GET `/api/public/metrics` | open | Public sample facet |
| GET `/api/public/other-systems` | open | Public sample facet |
| GET `/api/public/support-tickets` | open | Public sample facet |

**Not implemented yet (target spine):** `/api/roles*`, `/api/org-units*`, `/api/kb/*`, `/api/settings/branding`, full Organization/Collaboration/Environment CRUD.

### 1.4 Task / project shapes (I6 — still binding)

**Task status:** `planned` | `in_progress` | `waiting` | `blocked` | `done`  
**Task priority:** `low` | `normal` | `high` | `urgent`  
**User type:** `human` | `agent` only.

### 1.5 Versioning policy
| Label | Meaning |
|-------|---------|
| Contract doc series | Historically 0.2 → 0.3 → **0.4.0** (I6 work surfaces) |
| Product package (`package.json`) | **0.7.45** (hub I5.6 line) |
| GET `/api` index `version` | Still **0.4.0** (API capability label — lag intentional until API bump) |
| GET `/api/health` `version` | Tracks **package** `0.7.45` |

Do not invent agent-fleet endpoints. Grow toward zone entities per `state_i5_6_zone_erd.md`.

### 1.6 Non-goals (API v1)
- Host Versa AGi control-plane ops
- Full ERP (inventory, manufacturing, GL)
- Shared DB with host AGi

---

## 2. Current State
- Fixture-backed route handlers live and match inventory above.
- Auth + users + projects + tasks + public facets shipped.
- Agents routes still present as deprecated aliases.
- Contract file was stale on ERD pointer (pointed at keystone path now stubbed) and understated public facet routes.
- Version triple (package / health / api index) is inconsistent by design until next API series bump — document, do not silently “fix” without product decision.

## 3. Target State
- Single living API state doc (this file).
- Align index version with product when Stephen wants a 0.5/0.8 API series.
- Add zone-aligned resources after baseline ERD lock (see zone ERD state).
- Remove or hard-redirect `/api/agents*` when safe.

## 4. Backlog / Plan
| ID | Item | Priority |
|----|------|----------|
| API-1 | Keep this doc in sync when routes change | ongoing |
| API-2 | Decide API series bump vs keep 0.4.0 capability label | Stephen/COA |
| API-3 | Document write methods (POST/PATCH) when implemented | when built |
| API-4 | Zone entity routes after ERD baseline lock | blocked on I5.6 baseline |
| API-5 | Deprecation timeline for `/api/agents*` | later |

## 5. Results Feedback
| Date | Result |
|------|--------|
| 2026-07-20 | Statefold created from API_CONTRACT.md; route inventory verified against `src/app/api` |

## 6. Change Log
| Date | Change |
|------|--------|
| 2026-07-20 | I5.6.30 docs: statefold API contract; stub old path |

---

## Appendix — folded narrative detail

Full prior endpoint examples and JSON samples remain useful history. Prefer the inventory tables above for truth; when implementing, re-verify handlers. Original long-form examples lived in `docs/api/API_CONTRACT.md` pre-fold (git history + optional copy under `__archive/` if restored).

