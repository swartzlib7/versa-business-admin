# versa-admin-system

**Client mission control for a Versa AGi-powered business** — a standalone, distributable product that customers install with their Versa AGi system to see and manage everything their business runs through AGi: integrations, connected systems, operational work, and agent collaboration.

**Not AGI Top.** This is the customer-facing product surface — mission control for the *business*, not the host infrastructure console.

## Status

- **Phase:** Building (Iteration 1 — Shell polish + API contract + 3D↔2D link)
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
| API | Next.js Route Handlers (fixture-backed) |

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
npm run build
npm start
```

## API Endpoints

All endpoints return JSON. Fixture-backed (no database required). Full contract: `docs/api/API_CONTRACT.md`.

| Method | Path | Description | Query Filters |
|--------|------|-------------|---------------|
| GET | `/api` | Endpoint index | — |
| GET | `/api/health` | System health check | — |
| GET | `/api/agents` | Agent fleet list | `?status=active|idle|error|offline` |
| GET | `/api/projects` | Project list | `?status=active|paused|archived` |
| GET | `/api/integrations` | Connected systems | `?status=connected|disconnected|error` |
| GET | `/api/tasks` | Task queue | `?status=planned|in_progress|waiting|blocked|done` |

**Response envelope (list endpoints):**
```json
{ data: [...], count: 5 }
```

Examples:
```bash
curl http://localhost:3000/api
curl http://localhost:3000/api/agents?status=active
curl http://localhost:3000/api/tasks?status=in_progress
```

## White-Label Tokens

Branding is configured in `src/lib/theme.ts`. The **Settings page** (`/settings`) provides an editable preview where brand name and primary color can be changed and previewed live (session-local state).

## R3F Scene & 3D↔2D Interaction

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

## Iteration History

| Iteration | Focus | Commit |
|-----------|-------|--------|
| I0 | Foundations scaffold (Next.js 16, shadcn/ui v4, R3F, API stubs) | `8ddaac4` |
| I1 | Shell polish, API contract + query filters, 3D↔2D linkage | (current) |
