# Web-dev slice — Mission Control DB wrap (Track B remainder)

**Assigned:** 2026-07-23 (Stephen: wrap remaining database work; larger controlled chunks OK)  
**Base:** Rebase/FF `agent/web-dev` onto **`origin/beta` @ `3cfef0a`** (MC **0.7.51** — Phase 3 User POST/PATCH already shipped). Include polish tip **`2276121`** if not already on your branch.  
**Gate after you:** COA quality review → only then Stephen full check. **Do not** ask Stephen to review mid-slice.

## Why this slice

Stephen (2026-07-23): get **all remaining database work done and wrapped**; Web-dev implements; COA reviews quality; Stephen checks everything after COA is good. He accepts **larger controlled chunks**.

User pilot writes are already live (0.7.51). This slice finishes the **known Track B remainder** in one delivery unit.

## Already done (do not redo)

| Item | Ref |
|------|-----|
| Phase 0–1 scaffold, Vagrant PG, migrate, health | earlier |
| Phase 2 User seed/read + bcrypt login + hybrid adapter | 0.7.48+ |
| Phase 3 User create/update fixture + postgres; POST/PATCH `/api/users` | `3cfef0a` / 0.7.51 |
| Settings/Users light polish | `agent/web-dev` @ `2276121` |

## In scope (this chunk only)

### A. Seed expansion (`scripts/seed.mjs` or equivalent)

Idempotent upserts preserving fixture IDs where they exist:

1. **Catalog** — `value_set`, `value_set_item`, `field_definition`, `layout_definition` from `src/lib/fixtures/catalog.ts` (or minimal subset required for User/Project/Task/Product layouts). Seed **before** entities that reference value sets.
2. **Projects** — from `src/lib/fixtures/projects.ts` (owner FK → users).
3. **Tasks** — from `src/lib/fixtures/tasks.ts` (project + assignee FKs).
4. **Products** — from `src/lib/fixtures/products.ts` (`features` → `data` JSONB as designed).
5. **Integrations** — from fixtures; set `product_id` when mappable.
6. Keep existing org / departments / users seed behavior.

### B. Postgres adapter reads (Phase 4 rollup)

Implement real queries (stop `NOT_IMPLEMENTED`) for:

- `listProjects` / `getProject`
- `listTasks` / `getTask` (honor existing filters: status, projectId, priority, assignee, q)
- `listProducts`
- `listIntegrations`
- `listStaff` (public projection from `users` + bio/department as today)
- `getBusinessProfile` (organizations singleton)

Denormalized fixture fields (`projectName`, `assigneeName`, `ownerName`, `taskCount`, department string): **JOIN or compute in adapter** — do not require UI rewrites.

### C. Hybrid adapter (`src/lib/data/adapter.ts`)

When `DATA_SOURCE=postgres`, route the methods in **B** (and existing User + health + User writes) through `postgresAdapter`.  
Default **`fixture` must remain fully working** with DB down.

### D. Write surface completion (Phase 3 remainder beyond Users)

Mirror User write pattern (fixture mutable + postgres + routes + RBAC):

| Method | Route | Auth (match checklist) |
|--------|-------|-------------------------|
| `createProject` / `updateProject` | POST `/api/projects`, PATCH `/api/projects/[id]` | admin |
| `createTask` / `updateTask` | POST `/api/tasks`, PATCH `/api/tasks/[id]` | create: admin; update: admin **or** assignee |

- PATCH merges `data` JSONB (not full replace).
- Validate FKs (org/owner/project/assignee) and basic required fields.
- **Catalog validation (practical bar):** shared helper that enforces required core fields + enum/value-set where cheap; full exhaustive `field_definition` walk is nice-to-have if timeboxed — document any gap in commit notes. Do **not** block the slice on perfect metadata engine.

### E. Agents API cleanup (Phase 4)

- Prefer **`listAgents` / `getAgent`** as views over `users` where `type=agent` (map model/lastActive via `data` if present).
- **Remove or hard-deprecate** dedicated `/api/agents*` behavior per checklist (no separate agents table). If removal breaks an in-repo caller, fix the caller to `/api/users?type=agent`.

### F. Docs + version

- Update acceptance ticks in `docs/design/spec/state/state_db_cutover_checklist.md` for what you actually finished.
- Short status note in `docs/coa/MISSION_CONTROL_WBS.md` Track B phase table (Phase 3/4 → shipped this slice / residual).
- API-3 notes if write routes are new (`docs/api/API_CONTRACT.md` or existing API-3 section).
- Bump app version to **0.7.52**.

### G. Verify

- `npm run build` clean; no new lint errors you introduced.
- Smoke (fixture default): login, users list, projects list, tasks list, create/patch user still OK.
- Smoke (`DATA_SOURCE=postgres` on your Vagrant path): seed; login; list/get users/projects/tasks/products; create/patch project + task; health DB connected.
- Push `origin/agent/web-dev` and **notify COA** with SHAs + short test notes.
- **STOP** — no self-start of hub, 32c records tables, or next product slice.

## Out of scope

- Hub / org-board 3D / spatial twin  
- Buffer, writing lanes, non-MC repos  
- Environment zone entities (Location, Event, …)  
- Supabase / managed production Postgres  
- Sharing host AGi Organization DB  
- UI redesign (Settings/Users polish already done)  
- Record-type physical `records` tables (32g) unless a hard FK forces a tiny stub — default **no**  
- Unsolicited Phase work beyond this brief  

## Done when

1. Branch rebased on `origin/beta` @ `3cfef0a` (or newer beta tip if COA fast-forwards).  
2. In-scope A–G complete or explicitly listed residuals with reason.  
3. Build clean; smoke notes for fixture + postgres.  
4. COA messaged with commit SHAs — **await COA review** (Stephen only after COA sign-off).  

## Refs

- WBS: `docs/coa/MISSION_CONTROL_WBS.md`  
- Checklist: `docs/design/spec/state/state_db_cutover_checklist.md`  
- Adapter: `src/lib/data/adapter.ts`, `src/lib/db/postgres-adapter.ts`, `src/lib/db/schema.ts`  
- Prior User writes: beta `3cfef0a`  
- Collaboration: implement on `agent/web-dev`; COA = qa_reviewer before PU  

