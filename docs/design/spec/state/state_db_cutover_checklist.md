# State: DB Cutover Checklist

> **Role:** Sole go-to for the fixture to Postgres cutover plan. Living checklist -- no physical DB, no schema apply, no migrations run until Stephen approves Phase 1.
> **Product:** versa-admin-system (Mission Control) - Project #26 - Game #109
> **Slice:** DB cutover checklist (docs only) -- authorized by Stephen via COA 2026-07-21.

| Field | Value |
|-------|-------|
| **Feature** | Fixture to Postgres JSONB cutover plan |
| **Status** | Phase 0 approved (Stephen 2026-07-21) / Phase 1 in progress |
| **Last verified against code** | 2026-07-21 (agent/web-dev @ 45e3cfa, package 0.7.45) |
| **Primary code** | src/lib/data/adapter.ts, src/lib/fixtures/*, src/app/api/** |
| **Task** | #182 |
| **Parent state doc** | state_i5_6_zone_erd.md (section 1.4 persistence, section 4 backlog) |

---

## 1. Goals / Non-Goals

### Goals

1. **Leave the fixture-only spine intact** -- fixtures remain the default data source until cutover is explicitly approved per phase. No breaking changes to running UI.
2. **Postgres + JSONB lean schema** -- core columns for stable query/index/FK fields; data JSONB column per entity for flexible/custom attributes. No live DDL per custom field (locked decision, ERD section 1.4).
3. **Catalog-driven metadata** -- value_set, value_set_item, field_definition, layout_definition as real tables mirroring the existing fixture shapes in src/lib/fixtures/catalog.ts.
4. **Swap adapter, not routes** -- the DataAdapter interface in src/lib/data/adapter.ts is the seam. A postgresAdapter implementing the same interface replaces fixtureAdapter behind a flag/env switch. Route handlers stay unchanged.
5. **Keep session auth + RBAC** -- existing httpOnly cookie session (base64 fixture token) transitions to DB-backed credential verification. RBAC checks (isAdmin, isAuthenticated) remain the same interface.
6. **Phased, gated rollout** -- each phase requires explicit Stephen/COA go-ahead before starting. No phase auto-starts.

### Non-Goals

1. **No shared host AGi DB** -- Mission Control has its own Postgres instance. The host Versa AGi Organization table is not shared with Mission Party (locked, ERD section 1.4).
2. **No hub visual experiments** -- 3D hub visuals are closed (I5.6.28 line, Stephen 2026-07-20).
3. **No inventing new entities** -- only entities in the locked baseline ERD: User, Organization, Department, Party, Project, Task, Product + catalog tables. Environment zone entities (Location, Event, KnowledgeAsset, Schedule) are documented but deferred.
4. **No applying migrations to a live DB in this slice** -- this document is a plan only. No CREATE TABLE, no INSERT, no Postgres installation without Stephen's approval.
5. **No API wiring implementation** -- write methods (POST/PATCH) are documented in the sequence but not built in this slice.
6. **No UX polish passes** -- layout/form UI stays as-is; cutover is backend data layer only.

---

## 2. Current Fixture Inventory

### 2.1 Fixture files to target tables

| Fixture file | Export | Records | Target table(s) | Notes |
|---|---|---|---|---|
| src/lib/fixtures/users.ts | users: UserFixture[] | 6 | users | Includes password field (fixture-only). data JSON already present. department_id FK to departments. |
| src/lib/fixtures/agents.ts | agents: AgentFixture[] | 5 | users (WHERE type=agent) | **Deprecated alias** -- maps to users with type=agent. Separate fixture has extra fields (model, lastActive) not in User schema. See section 9 Risks. |
| src/lib/fixtures/projects.ts | projects: ProjectFixture[] | 5 | projects | ownerUserId FK to users. taskCount is denormalized -- compute via COUNT or keep as cached column. |
| src/lib/fixtures/tasks.ts | tasks: TaskFixture[] | 5 | tasks | projectId FK to projects. assigneeUserId FK to users. projectName, assigneeName are denormalized -- drop or keep as cached. |
| src/lib/fixtures/products.ts | products: Product[] | 4 | products | features: string[] goes to data JSONB or junction table. category and status map to value sets. |
| src/lib/fixtures/integrations.ts | integrations: IntegrationFixture[] | 5 | integrations | Belongs to Product (ERD: Product has 1:N Integrations). Currently standalone -- needs product_id FK. |
| src/lib/fixtures/business.ts | business: BusinessProfile | 1 | organizations (singleton) | Maps to Organization entity. Fields like slogan, logoUrl, description, purpose, production go to data JSONB. Core: name, contactEmail, contactPhone, address, website. |
| src/lib/fixtures/services.ts | services: Service[] | 6 | services | Public facet catalog. features: string[] goes to data JSONB. icon is UI-only metadata. |
| src/lib/fixtures/staff.ts | staff: StaffMember[] | 6 | users (public projection) | Public staff directory -- subset of users with bio and department. Overlaps with users fixture but different IDs (staff-1 vs user-1). See section 9 Risks. |
| src/lib/fixtures/catalog.ts | valueSets, valueSetItems, fieldDefinitions, layoutDefinitions | 8 VS, 26 VSI, FDs, LDs | value_set, value_set_item, field_definition, layout_definition | Direct 1:1 mapping to catalog tables. Already shaped per ERD section 1.4 stubs. |
| src/lib/fixtures/other-systems.ts | otherSystems: OtherSystemFixture[] | 4 | other_systems (or integrations with type) | Public facet. Could merge with integrations or stay separate. Deferred -- not in baseline ERD. |
| src/lib/fixtures/support-tickets.ts | supportTickets: SupportTicketFixture[] | 4 | support_tickets | Public facet. Not in baseline ERD -- deferred. |
| src/lib/fixtures/metrics.ts | metrics: MetricFixture[] | 6 | metrics (or computed) | Public facet. Could be real-time computed from DB rather than stored. Deferred. |
| src/lib/fixtures/knowledge-articles.ts | knowledgeArticles: KnowledgeArticleFixture[] | 4 | knowledge_articles (to knowledge_assets) | Public facet. Maps to KnowledgeAsset in ERD but baseline defers Environment zone. |
| src/lib/fixtures/business-graph.ts | businessGraphNodes, businessGraphLinks, constants | ~20 nodes | Derived (not stored) | 3D hub graph data -- computed from entity relationships, not a separate table. |

### 2.2 Fixture-backed API routes to adapter methods

| Route | Method | Adapter method | Fixture source | Target DB table |
|---|---|---|---|---|
| /api | GET | (static) | -- | -- |
| /api/health | GET | (static) | -- | -- (add DB ping in Phase 1) |
| /api/auth/login | POST | verifyCredentials() | users fixture | users (password hash check) |
| /api/auth/logout | POST | (session clear) | -- | -- |
| /api/auth/session | GET | getSessionFromRequest() | session cookie | session store (see section 9) |
| /api/users | GET | adapter.listUsers(type?) | users fixture | users |
| /api/users/[id] | GET | adapter.getUser(id) | users fixture | users |
| /api/agents | GET | adapter.listAgents(status?) | agents fixture | users WHERE type=agent |
| /api/agents/[id] | GET | adapter.getAgent(id) | agents fixture | users WHERE type=agent |
| /api/projects | GET | adapter.listProjects(filters?) | projects fixture | projects |
| /api/projects/[id] | GET | adapter.getProject(id) | projects fixture | projects |
| /api/tasks | GET | adapter.listTasks(filters?) | tasks fixture | tasks |
| /api/tasks/[id] | GET | adapter.getTask(id) | tasks fixture | tasks |
| /api/integrations | GET | adapter.listIntegrations(status?) | integrations fixture | integrations |
| /api/public/business | GET | adapter.getBusinessProfile() | business fixture | organizations (singleton) |
| /api/public/services | GET | adapter.listServices() | services fixture | services |
| /api/public/products | GET | adapter.listProducts() | products fixture | products |
| /api/public/staff | GET | adapter.listStaff() | staff fixture | users (public projection) |
| /api/public/knowledge-articles | GET | adapter.listKnowledgeArticles() | knowledgeArticles fixture | knowledge_assets (deferred) |
| /api/public/metrics | GET | adapter.listMetrics() | metrics fixture | computed (deferred) |
| /api/public/other-systems | GET | adapter.listOtherSystems() | otherSystems fixture | other_systems (deferred) |
| /api/public/support-tickets | GET | adapter.listSupportTickets() | supportTickets fixture | support_tickets (deferred) |

### 2.3 Adapter architecture

src/lib/data/ contains:
- adapter.ts -- DataAdapter interface + fixtureAdapter (default)
- types.ts -- Canonical types (re-exported from fixtures)
- index.ts -- Barrel export: adapter, types

**Key pattern:** All route handlers import { adapter } from @/lib/data. The fixtureAdapter is assigned as the default. Cutover = implement postgresAdapter satisfying DataAdapter, then swap the export. Routes do not change.

**Mutable state:** fixtureAdapter keeps mutable copies of agents, projects, tasks for in-process PATCH demos (mutableAgents, mutableProjects, mutableTasks). DB adapter replaces this with real persistence.

---

## 3. Target Schema Sketch

### 3.1 Core entities (baseline ERD locked)

```sql
-- Organization (singleton for v1; multi-tenant later)
CREATE TABLE organizations (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Department
CREATE TABLE departments (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- User (pilot object)
CREATE TABLE users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  type          TEXT NOT NULL DEFAULT 'human' CHECK (type IN ('human','agent')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  department_id TEXT REFERENCES departments(id),
  password_hash TEXT,  -- NULL for agents until auth strategy decided
  data          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Party (Collaboration zone -- single table + party_kind)
CREATE TABLE parties (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  party_kind      TEXT NOT NULL CHECK (party_kind IN ('vendor','customer','partner','branch')),
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project
CREATE TABLE projects (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  owner_user_id   TEXT REFERENCES users(id),
  priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  start_date      DATE,
  target_date     DATE,
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task
CREATE TABLE tasks (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','waiting','blocked','done')),
  priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assignee_user_id TEXT REFERENCES users(id),
  due_date        DATE,
  data            JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product
CREATE TABLE products (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  tagline         TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT,  -- maps to value_set 'product_category'
  status          TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','beta','coming-soon')),
  data            JSONB NOT NULL DEFAULT '{}',  -- features array, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integration (Product 1:N Integrations)
CREATE TABLE integrations (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id  TEXT REFERENCES products(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('email','cms','database','api','iot','messaging')),
  status      TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','error')),
  last_sync   TIMESTAMPTZ,
  description TEXT NOT NULL DEFAULT '',
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 Catalog tables (metadata layer)

```sql
CREATE TABLE value_set (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  api_name    TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE value_set_item (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  value_set_id  TEXT NOT NULL REFERENCES value_set(id),
  api_value     TEXT NOT NULL,
  label         TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(value_set_id, api_value)
);

CREATE TABLE field_definition (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  object_api_name         TEXT NOT NULL,
  api_name                TEXT NOT NULL,
  label                   TEXT NOT NULL,
  data_type               TEXT NOT NULL CHECK (data_type IN ('text','long_text','number','boolean','date','datetime','picklist','multipicklist','lookup','email','url','phone','currency')),
  is_system               BOOLEAN NOT NULL DEFAULT false,
  is_required             BOOLEAN NOT NULL DEFAULT false,
  default_value           TEXT,
  value_set_api_name      TEXT REFERENCES value_set(api_name),
  lookup_object_api_name  TEXT,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  active                  BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(object_api_name, api_name)
);

CREATE TABLE layout_definition (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  object_api_name TEXT NOT NULL,
  api_name        TEXT NOT NULL,
  label           TEXT NOT NULL,
  layout_type     TEXT NOT NULL CHECK (layout_type IN ('detail','edit','list')),
  version         INTEGER NOT NULL DEFAULT 1,
  body            JSONB NOT NULL DEFAULT '{}',
  is_default      BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(object_api_name, api_name, version)
);
```

### 3.3 Deferred entities (documented, not in Phase 1-4)

Environment zone: locations, events, knowledge_assets, schedules + their M:N junctions. Public facets: other_systems, support_tickets, metrics. These are documented for completeness but not part of the cutover phases.

### 3.4 FKs and unique keys summary

| Entity | FK | Unique key |
|---|---|---|
| departments | organization_id to organizations | (organization_id, code) |
| users | department_id to departments | email |
| parties | organization_id to organizations | -- |
| projects | organization_id to organizations, owner_user_id to users | -- |
| tasks | project_id to projects, assignee_user_id to users | -- |
| products | organization_id to organizations | -- |
| integrations | product_id to products | -- |
| value_set_item | value_set_id to value_set | (value_set_id, api_value) |
| field_definition | value_set_api_name to value_set(api_name) | (object_api_name, api_name) |
| layout_definition | -- | (object_api_name, api_name, version) |

---

## 4. ORM / Migration Tool Recommendation

### Recommendation: Drizzle ORM

**Why Drizzle for this codebase:**

| Factor | Drizzle | Prisma |
|---|---|---|
| **Next.js App Router** | Native -- serverless-friendly, no extra runtime process | Works but requires prisma generate step; heavier client |
| **TypeScript DX** | Schema-as-code in .ts -- types inferred from schema definition | Schema in .prisma DSL -- types generated |
| **SQL proximity** | SQL-like query builder; easy to drop to raw SQL for JSONB ops | Abstract query engine; raw SQL requires queryRaw |
| **JSONB support** | First-class jsonb() column type; operators for path queries | Supports Json type but JSONB-specific ops less ergonomic |
| **Migration story** | drizzle-kit generates SQL migrations from schema diff; reviewable | prisma migrate auto-applies; less control over migration SQL |
| **Bundle size** | Minimal -- per-query imports, tree-shakeable | Larger client (~3MB); potential cold-start impact on serverless |
| **Edge runtime** | Fully compatible | Limited (needs Prisma Accelerate or Data Proxy) |
| **Existing patterns** | Matches the codebase TS-first, minimal-dependency philosophy | Would introduce a new DSL and codegen step |

**Migration tooling:** drizzle-kit for schema to SQL migration generation. Migrations are version-controlled .sql files reviewed before apply.

**Connection pooling:** drizzle-orm/postgres-js with postgres-js driver (lightweight, serverless-friendly). For production: PgBouncer or Neon/Supabase pooler.

**Alternative considered:** Prisma -- viable but heavier. If Stephen prefers the DSL approach and auto-migration, Prisma is a reasonable second choice. The DataAdapter interface means the ORM choice is encapsulated in the adapter layer regardless.

**Decision needed from Stephen:** Approve Drizzle as ORM, or specify alternative. Do not install until approved.

---

## 5. Environment

### 5.1 Required environment variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mission_control

# Auth (existing -- keep for session)
AUTH_COOKIE_NAME=versa_session
AUTH_SESSION_MAX_AGE=604800  # 7 days in seconds

# Data source flag (cutover control)
DATA_SOURCE=fixture  # fixture | postgres  (default: fixture)

# Optional: connection pool size
DB_POOL_SIZE=10
```

### 5.2 Local vs staging

| Environment | Database | Data source | Purpose |
|---|---|---|---|
| **Local dev** | Docker Postgres or embedded (see 5.3) | fixture (default) to postgres (when testing) | Development + cutover testing |
| **Staging** | Managed Postgres (Neon/Supabase/RDS) | postgres | Pre-production validation |
| **Production** | Managed Postgres | postgres | Live (after Phase 4 sign-off) |

### 5.3 Local Postgres setup (Phase 1 -- not yet)

When Phase 1 is approved:
- Option A: docker compose with a postgres:16 service in the repo
- Option B: Local system Postgres (apt install postgresql-16)
- Option C: Neon/Supabase free-tier dev database (zero local install)

Recommendation: Option A (Docker) for reproducibility. Stephen must approve Docker usage on the host if not already available.

### 5.4 Seed strategy from fixtures

1. **Seed script** (scripts/seed.ts): reads fixture TS files, maps to Drizzle insert operations, writes to DB.
2. **Id stability:** Fixture string IDs (user-1, proj-1) are preserved as primary keys in seed data. This ensures existing UI links and references work. New records use gen_random_uuid().
3. **Catalog seed:** value_set, value_set_item, field_definition, layout_definition seeded directly from catalog.ts fixture -- 1:1 mapping.
4. **Password handling:** Fixture passwords (mission2026) are stored as bcrypt hashes in seed. The verifyCredentials function updates to compare against password_hash column.
5. **Re-runnable:** Seed script is idempotent -- INSERT ... ON CONFLICT DO NOTHING or upsert pattern.

### 5.5 Rollback story

| Scenario | Rollback action |
|---|---|
| **Adapter swap breaks reads** | Set DATA_SOURCE=fixture in env. App falls back to fixtureAdapter instantly. No data loss. |
| **Migration applied incorrectly** | drizzle-kit drop the migration; restore from DB snapshot. Fixtures are untouched. |
| **Seed data corrupted** | Drop + reseed: TRUNCATE all tables, re-run seed script. Fixtures are the source of truth. |
| **Phase 2+ read path broken** | Feature-flag per resource: DATA_SOURCE_USERS=postgres while others stay fixture. Granular rollback. |
| **Worst case** | Delete DB, set DATA_SOURCE=fixture, app works as before. Zero impact on fixture-backed operation. |

---

## 6. API Cutover Sequence

### 6.1 Ordered resource cutover steps

The DataAdapter interface is the seam. Each step swaps one adapter method from fixture to DB. Routes do not change.

| Step | Resource | Adapter methods | Route(s) | Phase | Notes |
|---|---|---|---|---|---|
| 1 | **Health check** | (new) adapter.healthCheck() | /api/health | Phase 1 | Add DB connectivity ping to health response. |
| 2 | **Organization** | getBusinessProfile() | /api/public/business | Phase 2 | Singleton row. Maps business fixture to organizations table. |
| 3 | **Users (read)** | listUsers(), getUser() | /api/users, /api/users/[id] | Phase 2 | Pilot object. Catalog-driven layout still works -- field_definitions + layout_definitions from DB. |
| 4 | **Auth (login)** | verifyCredentials() | /api/auth/login | Phase 2 | Swap fixture password check to DB password_hash check. Session token creation unchanged. |
| 5 | **Departments** | (new) listDepartments() | (future route) | Phase 2 | Needed as FK target for users. May not have a route yet -- seed for FK integrity. |
| 6 | **Catalog** | (new) listValueSets(), listFieldDefinitions(), getLayout() | (used by UI directly) | Phase 2 | Catalog tables seeded; UI imports shift from fixture to adapter. |
| 7 | **Projects (read)** | listProjects(), getProject() | /api/projects, /api/projects/[id] | Phase 4 | Same pattern as users. |
| 8 | **Tasks (read)** | listTasks(), getTask() | /api/tasks, /api/tasks/[id] | Phase 4 | FK to projects + users. |
| 9 | **Products (read)** | listProducts() | /api/public/products | Phase 4 | features array goes to data JSONB. |
| 10 | **Integrations (read)** | listIntegrations() | /api/integrations | Phase 4 | Add product_id FK. |
| 11 | **Staff (read)** | listStaff() | /api/public/staff | Phase 4 | Public projection from users table. Resolve staff-vs-user ID gap (section 9). |
| 12 | **Agents (deprecated)** | listAgents(), getAgent() | /api/agents, /api/agents/[id] | Phase 4 | Query users WHERE type=agent. Map agent fixture fields (model, lastActive) to data JSONB. |
| 13 | **Write methods** | createUser(), updateUser(), createProject(), etc. | POST/PATCH routes | Phase 3 | New adapter methods + new route handlers. Document in API contract (API-3). |

### 6.2 Auth + RBAC preservation

- **Session:** httpOnly cookie stays. Token encoding may change from base64 to signed JWT (optional, Stephen decision). Session validation logic stays in auth.ts.
- **RBAC:** isAdmin(session) and isAuthenticated(session) unchanged -- they check session fields, not data source.
- **Login flow:** verifyCredentials(email, password) then DB query: SELECT * FROM users WHERE email = $1 AND status = active then bcrypt compare then create session token. Same return type.

### 6.3 Write methods (POST/PATCH) -- when introduced (Phase 3, API-3)

| Method | Route | Adapter method | Auth | Validation |
|---|---|---|---|---|
| POST | /api/users | createUser(input) | admin | email unique, role/type valid |
| PATCH | /api/users/[id] | updateUser(id, input) | admin or self | partial update, data JSON merge |
| POST | /api/projects | createProject(input) | admin | org FK, owner FK |
| PATCH | /api/projects/[id] | updateProject(id, input) | admin | partial update |
| POST | /api/tasks | createTask(input) | admin | project FK, assignee FK |
| PATCH | /api/tasks/[id] | updateTask(id, input) | admin or assignee | partial update |

Write methods validate against field_definition catalog (required fields, data types). data JSONB is merged on PATCH (not replaced).

---

## 7. Data Migration

### 7.1 Fixture JSON to seed SQL/TS

**Approach:** TypeScript seed script (scripts/seed.ts) that imports fixture arrays and inserts via Drizzle ORM.

```typescript
// Conceptual -- not yet implemented
import { users as userFixtures } from '@/lib/fixtures/users';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

async function seedUsers() {
  for (const u of userFixtures) {
    await db.insert(users).values({
      id: u.id,                    // preserve fixture ID
      email: u.email,
      name: u.name,
      role: u.role,
      type: u.type,
      status: u.status,
      department_id: u.department_id,
      password_hash: await bcrypt.hash(u.password, 10),
      data: u.data ?? {},
    }).onConflictDoNothing();
  }
}
```

### 7.2 ID stability

| Source | ID format | Strategy |
|---|---|---|
| Fixture IDs | user-1, proj-1, task-1, dept-leadership | **Preserved as PK** in seed. Existing UI links, API responses, and FK references continue to work. |
| New DB-generated IDs | UUID | gen_random_uuid() for records created post-cutover. |
| Catalog IDs | vs-user-status, fd-user-email | **Preserved** -- catalog fixtures already use stable api_name keys. |

### 7.3 Denormalized fields

| Field | Current (fixture) | Target (DB) | Strategy |
|---|---|---|---|
| projectName on Task | Stored in fixture | Not stored -- JOIN projects | Drop from adapter response; UI joins or adapter computes. |
| assigneeName on Task | Stored in fixture | Not stored -- JOIN users | Same. |
| ownerName on Project | Stored in fixture | Not stored -- JOIN users | Same. |
| taskCount on Project | Stored in fixture | Computed -- COUNT(*) subquery | Adapter computes or materialized view later. |
| department (string) on User | Stored alongside department_id | Not stored -- JOIN departments | Adapter resolves name from FK. |

### 7.4 Empty-state behavior

- If DB has zero rows for a resource, API returns { data: [], count: 0 } -- same as fixture with empty array.
- UI already handles empty lists (listing tables show no records state).
- Catalog tables must be seeded before entity tables (FK references in field_definition point to value_set.api_name).
- If DATA_SOURCE=fixture, all DB tables are ignored -- fixtures are the fallback.

---

## 8. Acceptance Criteria

Binary checks Stephen/COA can sign:

### Phase 0 -- Checklist approval
- [x] Stephen reviews this checklist and approves (or requests edits)
- [x] ORM choice approved (Drizzle recommended)
- [x] Local Postgres approach approved (Docker recommended)

### Phase 1 -- Scaffold + migrate empty
- [ ] Postgres running locally (Docker or approved method) — **BLOCKED: Docker socket permission denied for agent user**
- [x] Drizzle schema file (src/lib/db/schema.ts) matches section 3 sketch
- [x] drizzle-kit generate creates migration SQL (12 tables) — migrate pending Docker/Postgres access
- [x] /api/health reports DB connectivity status
- [x] DATA_SOURCE=fixture still works -- app unchanged when DB is down (build passes clean)
- [x] Empty DB returns empty lists for users (skeleton returns []); other methods throw NOT_IMPLEMENTED — pending DB for full verification

### Phase 2 -- Seed + read path (User pilot)
- [ ] Seed script runs successfully -- all fixture data in DB
- [ ] GET /api/users returns same data from DB as from fixtures (field-for-field)
- [ ] GET /api/users/[id] returns correct user detail from DB
- [ ] POST /api/auth/login authenticates against DB password_hash
- [ ] Catalog-driven form on /users/[id] still works -- field definitions + layout from DB
- [ ] GET /api/public/business returns organization from DB
- [ ] DATA_SOURCE=fixture fallback still works instantly
- [ ] No TypeScript errors, npm run build passes

### Phase 3 -- Writes
- [ ] POST /api/users creates a user in DB
- [ ] PATCH /api/users/[id] updates user fields + merges data JSON
- [ ] Write methods enforce RBAC (admin-only for create, admin-or-self for update)
- [ ] Write methods validate required fields per field_definition catalog
- [ ] API contract doc updated with write method signatures (API-3)

### Phase 4 -- Roll to Project/Task/Product
- [ ] GET /api/projects returns from DB
- [ ] GET /api/tasks returns from DB (with JOIN for project/assignee names)
- [ ] GET /api/public/products returns from DB
- [ ] GET /api/integrations returns from DB (with product_id FK)
- [ ] GET /api/public/staff returns public projection from users table
- [ ] GET /api/agents returns users WHERE type=agent from DB
- [ ] All acceptance criteria from Phase 2 apply to each rolled resource
- [ ] Full npm run build passes
- [ ] Fixtures still available behind DATA_SOURCE=fixture flag

---

## 9. Risks / Open Questions

### Risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Staff vs User ID gap** -- staff-1 (staff fixture) is not user-1 (users fixture) for the same person (Alex Morgan). | Seed conflict or broken public staff page. | Map staff records to their corresponding user IDs during seed. Staff fixture becomes a view/projection, not a separate table. |
| R2 | **Agents fixture divergence** -- agents.ts has fields (model, lastActive, status: active/idle/error/offline) not in User schema. | Data loss when agents route queries users WHERE type=agent. | Store extra fields in users.data JSONB. Map status values: agent fixture active/idle/error/offline to user status + data.agent_status. Or keep agents as a separate view. **Needs Stephen decision.** |
| R3 | **Session store** -- current sessions are base64-encoded JSON in a cookie (no server-side store). Scaling writes (Phase 3) may need server-side session invalidation. | Cannot revoke sessions; no session list. | **LOCKED:** Phase 1-2 keep current httpOnly cookie as-is. Phase 3 later: sign cookie payload (still cookie). No JWT, no sessions table unless later need revoke/list. |
| R4 | **Version triple drift** -- package.json (0.7.45), /api/health (0.7.45), /api index (0.4.0). Cutover may warrant a version bump. | Confusion about which version is the version. | Document in API contract (API-2). Do not silently align. **Needs Stephen decision on API series bump.** |
| R5 | **Deprecating /api/agents*** -- deprecated alias still served. Cutover is a natural removal point but may break existing integrations. | Breaking change if removed without notice. | **LOCKED (Phase 4):** Remove /api/agents* (no deprecated alias). Schema must NOT invent an agents table. Removal is Phase 4 deliverable, not Phase 1. |
| R6 | **Postgres on host** -- installing Postgres or Docker on the host requires Stephen's approval. | Blocks Phase 1. | Present options (Docker, Neon, Supabase) and let Stephen choose. Do not install without explicit go. |
| R7 | **JSONB query performance** -- flexible attrs in data JSONB may need GIN indexes for production-scale queries. | Slow queries on custom fields. | Add GIN index on data column per entity. Document as Phase 2+ optimization. |
| R8 | **Transaction boundaries** -- fixture adapter has no transactions. DB adapter needs transactional writes for multi-table operations (e.g., create user + assign to department). | Partial writes on failure. | Use Drizzle transaction wrappers in adapter write methods. |

### Open questions for Stephen

1. **ORM approval** -- Drizzle (recommended) or Prisma? Or raw SQL driver (postgres-js only)?
2. **Postgres hosting** -- Docker on host, Neon, Supabase, or RDS? (Phase 1 blocker)
3. **Session strategy** -- Keep cookie-based base64, move to signed JWT, or add server-side sessions table? (Phase 3)
4. **Agents fixture fate** -- Merge into users with data JSONB for extra fields, or keep a separate agents view/table? (Phase 4)
5. **API version bump** -- Align /api index version to 0.5/0.8 with cutover, or keep 0.4.0 capability label? (API-2)
6. **/api/agents* removal timeline** -- Remove in Phase 4, or keep as deprecated alias longer? (API-5)
7. **Docker on host** -- Is Docker available/approved for local Postgres, or should we use a managed service?

---

## 10. Phased Plan

### Phase 0 -- Checklist approval (current)

| Step | Deliverable | Gate |
|---|---|---|
| 0.1 | This checklist drafted on agent/web-dev | Done (this doc) |
| 0.2 | COA reviews + relays to Stephen | In progress |
| 0.3 | Stephen reviews, approves or requests edits | **Awaiting** |
| 0.4 | ORM + hosting decisions recorded | **Awaiting** |

**No Phase 1 work starts until Phase 0 is signed off.**

### Phase 1 -- Scaffold + migrate empty

| Step | Deliverable | Gate |
|---|---|---|
| 1.1 | Install Drizzle + postgres-js (after ORM approval) | Dependencies added |
| 1.2 | Create src/lib/db/schema.ts matching section 3 sketch | Schema file reviewed |
| 1.3 | Create src/lib/db/client.ts -- connection + pool | DB connects |
| 1.4 | Run drizzle-kit migrate -- create all tables | Tables exist, empty |
| 1.5 | Add adapter.healthCheck() to DataAdapter interface | Health route reports DB status |
| 1.6 | Implement postgresAdapter skeleton (all methods throw NOT_IMPLEMENTED) | Compiles, DATA_SOURCE=postgres does not crash app |
| 1.7 | DATA_SOURCE=fixture still works -- full build passes | Sign-off to proceed |

### Phase 2 -- Seed + read path (User pilot)

| Step | Deliverable | Gate |
|---|---|---|
| 2.1 | Write scripts/seed.ts -- seed all fixture data to DB | Seed runs clean |
| 2.2 | Implement postgresAdapter.getBusinessProfile() | /api/public/business from DB |
| 2.3 | Implement postgresAdapter.listUsers() + getUser() | /api/users from DB |
| 2.4 | Implement catalog read methods (value sets, field defs, layouts) | UI layout-driven forms work from DB |
| 2.5 | Update verifyCredentials() to check DB password_hash | Login works against DB |
| 2.6 | Seed departments (FK target for users) | Users have valid department_id |
| 2.7 | Verify: field-for-field parity with fixture responses | Sign-off to proceed |

### Phase 3 -- Writes

| Step | Deliverable | Gate |
|---|---|---|
| 3.1 | Add write methods to DataAdapter interface | Interface updated |
| 3.2 | Implement createUser(), updateUser() in postgresAdapter | POST/PATCH /api/users works |
| 3.3 | Add POST/PATCH route handlers for users | Routes return 201/200 |
| 3.4 | Implement field_definition validation on writes | Required fields enforced |
| 3.5 | Update API contract doc (API-3) with write method docs | Contract current |
| 3.6 | Session strategy decision implemented (if Stephen decides) | Auth is DB-backed |
| 3.7 | Verify: create + update + RBAC enforcement | Sign-off to proceed |

### Phase 4 -- Roll to Project/Task/Product

| Step | Deliverable | Gate |
|---|---|---|
| 4.1 | Implement listProjects() + getProject() with JOINs | /api/projects from DB |
| 4.2 | Implement listTasks() + getTask() with JOINs | /api/tasks from DB |
| 4.3 | Implement listProducts() | /api/public/products from DB |
| 4.4 | Implement listIntegrations() (add product_id FK) | /api/integrations from DB |
| 4.5 | Implement listStaff() as users projection | /api/public/staff from DB |
| 4.6 | Implement listAgents() as users WHERE type=agent | /api/agents from DB |
| 4.7 | Add write methods for projects, tasks (same pattern as users) | POST/PATCH works |
| 4.8 | Full build + all acceptance criteria pass | Final sign-off |
| 4.9 | Set DATA_SOURCE=postgres as default | Cutover complete |

**No phase starts without explicit go after checklist review.**

---

## Change Log

| Date | Change |
|---|---|
| 2026-07-21 | Initial draft created -- DB cutover checklist (slice authorized by Stephen via COA) |
| 2026-07-21 | Phase 0 SIGNED by Stephen. Locked decisions: Drizzle ORM; Supabase later / local plain PG Docker; cookie sessions P1-2; agents=users (no agents table); API version bump with cutover; /api/agents* removal is Phase 4. |
| 2026-07-21 | Phase 1 scaffold complete: drizzle-orm + postgres-js + drizzle-kit installed; schema.ts (12 tables matching section 3); client.ts (pool + healthCheck); postgres-adapter.ts skeleton (NOT_IMPLEMENTED + empty returns for users); docker-postgres.sh script; .env.example; health route updated; drizzle-kit generate produces 0000_fuzzy_nehzno.sql. Build passes clean. Docker socket permission denied — migrate pending. |
