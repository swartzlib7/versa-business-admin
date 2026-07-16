# Iteration 6 — Work surfaces (Projects + Tasks)

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Depends on:** I5 + I5.1 accepted (auth/RBAC + vanilla public fixtures on beta `7f5eede`)  
**Date:** 2026-07-16  
**Branch:** `agent/web-dev` (shared checkout via symlink is fine)

## Goal

Turn **Projects** and **Tasks** into first-class **business work surfaces**: own product ERD language (not host AGi games/agents), list + detail APIs with filters, and usable authenticated UI tables — fixture-backed, auth-gated, RBAC-aware.

## Context (already shipped — do not re-do)

| Slice | Status |
|-------|--------|
| I4 public site foundation | Done (`88e07d6`) |
| I5 auth + RBAC skeleton | Done (`4722828` + docs) |
| I5.1 vanilla public sample data | Done (`7f5eede`) — Northstar generic template |
| List `GET /api/projects`, `GET /api/tasks` | Exist, session-required |
| Basic `/projects` and `/tasks` pages | Exist (list-only, transitional fields) |

**Public site stays vanilla.** Do not reintroduce Versa/IoT/Smart Yard branding into fixtures. Versa-branded public content was archived separately for a future Versa site (`preserve/versa-public-site-v1` tag + `versa-agi/preserved-public-site-v1/`).

## Deliverables

### 1. Business ERD language (types + fixtures)

Refactor Project / Task models toward **Mission business entities**:

**Project (target fields):**
- `id`, `name`, `description`
- `status`: `active` | `paused` | `completed` | `archived` (or keep current set if you document mapping)
- `ownerUserId` (human or agent user id from Users fixtures)
- `priority` optional: `low` | `normal` | `high`
- `startDate`, `targetDate` optional ISO dates
- `taskCount` derived or stored
- **Remove or demote host-only fields:** `gameId`, `gameName`, `agentCount` — if kept temporarily, mark deprecated in types + API contract and hide from primary UI columns

**Task (target fields):**
- `id`, `title`, `description` (optional)
- `status`: `planned` | `in_progress` | `waiting` | `blocked` | `done`
- `priority`: `low` | `normal` | `high` | `urgent`
- `projectId`, `projectName` (name may be denormalized for list UX)
- `assigneeUserId` + display name (prefer user id over free-text only)
- `dueDate` ISO date string
- Optional: `createdAt`, `updatedAt`

Update `src/lib/data/types.ts`, fixtures, and adapter methods accordingly. Keep Northstar-style **generic business** sample content.

### 2. API parity

**Projects**
- `GET /api/projects` — list; filters: `?status=`, optional `?q=` (name/description contains)
- `GET /api/projects/[id]` — detail; **404** standard error shape if missing
- Optional (nice-to-have): `POST /api/projects` (admin only), `PATCH /api/projects/[id]` (admin; member read-only) mutating fixture store for process lifetime — label experimental if implemented

**Tasks**
- `GET /api/tasks` — list; filters: `?status=`, `?projectId=`, `?priority=`, optional `?assignee=` / `?q=`
- `GET /api/tasks/[id]` — detail; **404** if missing
- Optional: `POST` / `PATCH` same rules as projects (admin write)

All routes:
- Require authenticated session (401 unauthenticated)
- Respect RBAC: **member** can read; **admin** for any writes you add
- Use adapter layer (no direct fixture imports in route handlers)
- Document in `docs/api/API_CONTRACT.md` + update `GET /api` index
- Bump product version strings to **0.4.0** (package.json, health, contract) if you change API surface meaningfully

### 3. UI work surfaces

**`/projects`**
- Table: name, status, owner, task count, target date (as available)
- Filters: status (and search if API supports `q`)
- Row → detail: `/projects/[id]` **or** side panel with description + related tasks list
- Empty / loading / error states
- Auth: unauthenticated users redirected to login (existing pattern)

**`/tasks`**
- Table: title, status, priority, project, assignee, due date
- Filters: status, project, priority
- Row → detail: `/tasks/[id]` **or** panel
- Visual priority/status badges consistent with existing shell

**Navigation**
- Ensure shell sidebar labels stay business language (Projects, Tasks)
- No new “Games” chrome

### 4. Quality bar

- `npm run build` clean
- Smoke notes in handoff:
  - login as admin@example.com / mission2026
  - list + detail projects/tasks
  - 401 without cookie; 404 unknown id
  - member can read; admin-only writes if implemented
- README short section: work surfaces demo steps
- Commit on `agent/web-dev` with clear message; handoff to COA with SHA

## Out of scope

- Real database / persistence choice (still open)
- Org structure (I7), Knowledgebase (I8)
- Public site redesign
- Host Versa AGi live integration
- Full ERP modules
- Replacing Users/Auth from I5

## Acceptance criteria

- [ ] Project/Task types and fixtures use business fields; host game/agent framing removed or clearly deprecated
- [ ] Detail endpoints for projects and tasks with correct 401/404
- [ ] List filters work as documented (`status` minimum; projectId on tasks)
- [ ] Authenticated UI tables + detail for both resources
- [ ] API_CONTRACT + version strings updated
- [ ] Build clean; COA handoff with SHA + demo steps

## Read first

- `docs/specs/PRODUCTION_PLAN.md` § I6
- `docs/specs/PRODUCT_SPECIFICATION.md` (Projects / Tasks as business entities)
- `docs/api/API_CONTRACT.md`
- `src/lib/auth.ts`, `src/lib/data/*`, existing projects/tasks routes and pages
- I5 patterns for session + RBAC on `/api/users`

## Demo notes for handoff

1. `npm run build` (or use existing :3100 after COA rebuild if you only push code)
2. Login → `/projects` table populated from fixtures
3. Open project detail; see related tasks if linked
4. `/tasks` with status/project filters
5. `curl` with session cookie: list + detail + 404
6. Unauthenticated `curl` → 401

## Notes for web-dev

- Shared workspace symlink to COA checkout is intentional — one git tree.
- Prefer small commits; one feature commit is fine if clean.
- When done: internal message to COA with SHA + demo steps (same pattern as I4/I5).
