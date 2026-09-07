# State: Mission HTTP API Contract

> **Role:** Sole go-to for Versa AGi Mission product HTTP API behavior, implemented routes, and planned resources.
> **Product:** versa-admin-system (Mission Control) · Project #26 · Game #109
> **Doc home:** docs/production/state/
> **Map:** shape_mission_control.md

| Field | Value |
|-------|-------|
| **Feature** | Product HTTP API (`/api/*`) |
| **Status** | ✅ 0.7.141 catalog complete for the shipped feature set |
| **Last verified against code** | 2026-09-07 (package `0.7.141`) |
| **Primary code** | `src/app/api/**`, `src/lib/api/inventory.ts` |
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

### 1.3 Implemented routes (code inventory 2026-09-07)

The live catalog is `src/lib/api/inventory.ts`. GET `/api` (open) returns `version` from `package.json`, `docs` links, and `resources[]`. Settings → **API** (`/settings?tab=api`) renders that same catalog in the operator backend.

Canonical public System Landscape path is `/api/public/system-landscape`. `/api/public/other-systems` is a deprecated alias.

`/api/agents*` remains a deprecated redirect to `/api/users`.

Do not duplicate the endpoint table here — change `inventory.ts`, then this file’s Current State / Change Log.

**Not in this version (do not invent):** `/api/roles*`, `/api/org-units*`, `/api/kb/*` as separate modules, receipt tabs, page-builder APIs. Zone CRUD goes through `/api/records` + `/api/organizations`.

### 1.4 Task / project shapes (I6 — still binding)

**Task status:** `planned` | `in_progress` | `waiting` | `blocked` | `done`  
**Task priority:** `low` | `normal` | `high` | `urgent`  
**User type:** `human` | `agent` only.

### 1.5 Versioning policy
| Label | Meaning |
|-------|---------|
| Product package (`package.json`) | **0.7.141** |
| GET `/api` index `version` | Same as package |
| GET `/api/health` `version` | Same as package |
| GET `/api/catalog` `version` | Same as package |

Operator documentation surface: Settings → API. Machine index: GET `/api`. Living contract: this file.

### 1.6 Non-goals (API v1)
- Host Versa AGi control-plane ops
- Full ERP (inventory, manufacturing, GL)
- Shared DB with host AGi

---

## 2. Current State
- `src/lib/api/inventory.ts` is the route catalog for 0.7.141. GET `/api` and Settings → API consume it.
- Catalog, records, organizations, settings (system/branding/public-content/sample-data/agent-packages), element-config, auth challenge, and public facets are implemented.
- `/api/public/system-landscape` is the canonical public facet; `/api/public/other-systems` is an alias.
- `/api/agents*` remains a deprecated alias of users.
- Fixture + postgres hybrid still applies per adapter; Demo never swaps the live backend.

## 3. Target State
- Keep inventory.ts in lockstep with `src/app/api/**`.
- Remove `/api/agents*` and `/api/public/other-systems` when Stephen retires aliases.
- Do not add page-builder or I5.6.34+ routes until tasked.

## 4. Backlog / Plan
| ID | Item | Priority |
|----|------|----------|
| API-1 | Keep inventory.ts in sync when routes change | ongoing |
| API-3 | POST/PATCH /api/projects + /api/tasks write routes | done |
| API-2 | Align GET `/api` version with package | **done 2026-09-07** |
| API-4 | Zone entity routes after ERD baseline lock | done via `/api/records` + `/api/organizations` |
| API-5 | Deprecation timeline for `/api/agents*` | later |
| API-6 | Operator Settings → API + docs links on GET `/api` | **done 2026-09-07** |

## 5. Results Feedback
| Date | Result |
|------|--------|
| 2026-07-20 | Statefold created from API_CONTRACT.md; route inventory verified against `src/app/api` |
| 2026-09-07 | 0.7.141: catalog complete vs handlers; Settings → API; System Landscape alias |

## 6. Change Log
| Date | Change |
|------|--------|
| 2026-07-20 | I5.6.30 docs: statefold API contract; stub old path |
| 2026-09-07 | 0.7.141: living inventory, operator docs tab, version alignment |

---

## Appendix — folded narrative detail

Full prior endpoint examples and JSON samples remain useful history. Prefer the inventory tables above for truth; when implementing, re-verify handlers. Original long-form examples lived in `docs/api/API_CONTRACT.md` pre-fold (git history + optional copy under `__archive/` if restored).



## API-3 — User writes (Phase 3, 2026-07-23)

| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/api/users` | session + admin | Body: email, name; optional role, type, status, department, department_id, bio, password, data. 201 + user. |
| PATCH | `/api/users/{id}` | session + admin or self | Partial update; `data` JSON merged. Members cannot change role/type/status. |

Errors: 400 VALIDATION_ERROR, 403 FORBIDDEN, 409 CONFLICT (email), 404 NOT_FOUND.

Adapter: `createUser` / `updateUser` on fixture (in-memory) and postgres paths. Hybrid DATA_SOURCE=postgres routes User writes to DB.

Product version: **0.7.51**.
