# versa-admin-system

**Client mission control for a Versa AGi-powered business** — a standalone, distributable product that customers install with their Versa AGi system to see and manage everything their business runs through AGi: integrations, connected systems, operational work, and agent collaboration.

**Not AGI Top.** This is the customer-facing product surface — mission control for the *business*, not the host infrastructure console.

## Status

- **Phase:** Building (Iteration 6 complete; I5.2 public template aligned to maker / UGPN essence)
- **Project ID:** 26
- **Git:** local `main` (no remote yet)
- **Game:** Versa Voice AI LLC (#109)

## Stack

| Layer | Choice |
|-------|--------|
| UI library | React 19 |
| 3D | React Three Fiber + @react-three/drei |
| App framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Language | TypeScript |
| API | Next.js Route Handlers (fixture-backed via data adapter) |

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
npm run build
npm start
```

## API Endpoints

All endpoints return JSON. Fixture-backed via a modular data adapter (`src/lib/data/`). Full contract: `docs/api/API_CONTRACT.md`.

| Method | Path | Description | Query Filters |
|--------|------|-------------|---------------|
| GET | `/api` | Endpoint index | — |
| GET | `/api/health` | System health check | — |
| GET | `/api/agents` | Agent fleet list | `?status=active|idle|error|offline` |
| GET | `/api/agents/{id}` | Single agent detail | — |
| PATCH | `/api/agents/{id}` | **Experimental** — mutate agent status | — |
| GET | `/api/projects` | Project list | `?status=active|paused|archived` |
| GET | `/api/integrations` | Connected systems | `?status=connected|disconnected|error` |
| GET | `/api/tasks` | Task queue | `?status=planned|in_progress|waiting|blocked|done` |

**Response envelope (list endpoints):**
```json
{ "data": [...], "count": 5 }
```

**Error shape (404, 400, 501):**
```json
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

Examples:
```bash
curl http://localhost:3000/api
curl http://localhost:3000/api/agents?status=active
curl http://localhost:3000/api/agents/agent-1
curl http://localhost:3000/api/agents/missing  # → 404
curl -X PATCH http://localhost:3000/api/agents/agent-1 -H 'Content-Type: application/json' -d '{"status":"idle"}'
```

## Data Adapter Pattern

Route handlers call through a `DataAdapter` interface (`src/lib/data/adapter.ts`) rather than importing fixture arrays directly. The default `fixtureAdapter` implementation uses in-memory fixture data. When real Versa AGi host integration is added, a new adapter implementation can be swapped in without touching route code.

```
src/lib/data/
  types.ts      — canonical data types (Agent, Project, Task, Integration)
  adapter.ts    — DataAdapter interface + fixtureAdapter implementation
  index.ts      — barrel export
```

## Agents Fleet UI

The **Agents page** (`/agents`) is a filterable fleet table showing name, role, status (with color-coded dot + badge), model, and last-active timestamp. Click any row to navigate to the agent detail page.

**Agent detail** (`/agents/{id}`) shows full agent information and includes an experimental **Cycle** button that sends a PATCH request to advance the agent's status through the lifecycle (active → idle → error → offline → active). Changes persist in memory for the dev server lifetime.

## Projects — Grouped by Game

The **Projects page** (`/projects`) groups projects by their parent game, with a color-coded dot and game name header. Each game section shows a count badge and a grid of project cards.

## White-Label Tokens

Branding is configured in `src/lib/theme.ts`. The **Settings page** (`/settings`) provides an editable preview where brand name and primary color can be changed and previewed live (session-local state).

## R3F Scene & 3D→2D Linkage

The Dashboard includes a React Three Fiber canvas (`MissionControlScene`) showing:

- A central pulsing sphere (system core — pulses faster when a node is focused)
- Orbiting node cluster representing **real fixture entities** (agents and projects)
- Agent nodes colored by status (green=active, yellow=idle, red=error, gray=offline)
- Project nodes colored by status (blue=active, amber=paused, gray=archived)
- Text labels above each node
- Connecting lines between nearby nodes
- OrbitControls for camera manipulation

### 3D → 2D Linkage

**Click any node** in the 3D scene to focus it. A detail card appears below the scene showing agent or project details. Click the same node again (or another node) to toggle/dismiss. This proves the R3F→React state bridge.

## Work Surfaces (I6)

Projects and Tasks are first-class business work surfaces with list + detail APIs and auth-gated UI tables.

### Demo Steps

1. Start the dev server: npm run dev
2. Login at /login with admin@example.com / mission2026 (admin) or member@example.com / mission2026 (member)
3. Navigate to /projects - table with name, status, priority, owner, task count, target date
4. Filter by status or search by name/description
5. Click a project row to view /projects/[id] - overview + related tasks list
6. Navigate to /tasks - table with title, status, priority, project, assignee, due date
7. Filter by status, priority, or project
8. Click a task row to view /tasks/[id] - full details with project link

### API Smoke Test

- Login: POST /api/auth/login with JSON body, save cookie
- List projects: GET /api/projects (authenticated) returns data array + count
- Filter: GET /api/projects?status=active
- Search: GET /api/projects?q=website
- Detail: GET /api/projects/proj-1 (includes related tasks array)
- 404: GET /api/projects/nonexistent returns standard error shape
- Tasks with filters: GET /api/tasks?status=in_progress&priority=high
- Task detail: GET /api/tasks/task-1
- Unauthenticated: GET /api/projects returns 401

## Iteration History

| Iteration | Focus | Commit |
|-----------|-------|--------|
| I0 | Foundations scaffold (Next.js 16, shadcn/ui v4, R3F, API stubs) | `8ddaac4` |
| I1 | Shell polish, API contract + query filters, 3D→2D linkage | `f851d62` |
| I2 | Agent API depth, data adapter, Agents fleet UI, projects grouped by game | - |
| I3 | Capability spine + path A; reframe Mission vs ERP competitors | - |
| I4 | Public site foundation (hero, services, products, staff, contact) | 88e07d6 |
| I5 | Auth + RBAC skeleton (login/session, roles, Users resource, route protection) | 4722828 |
| I5.1 | Vanilla public sample data - generic business template | 7f5eede |
| I6 | Work surfaces: Projects + Tasks business ERD, list+detail APIs, auth-gated UI tables | 7082c6e |
| I5.3 | Public Mission Control template (generic facets: systems, integrations, operations, support, metrics, knowledge) | (current) |
