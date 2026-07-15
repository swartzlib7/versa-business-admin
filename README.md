# versa-admin-system

**Client mission control for a Versa AGi-powered business** — a standalone, distributable product that customers install with their Versa AGi system to see and manage everything their business runs through AGi: integrations, connected systems, operational work, and agent collaboration.

**Not AGI Top.** This is the customer-facing product surface — mission control for the *business*, not the host infrastructure console.

## Status

- **Phase:** Building (Iteration 0 — Foundations scaffold)
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
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm start
```

## Project Structure

```
versa-admin-system/
├── docs/                          # Specifications, research, handoffs
│   ├── handoffs/                  # Iteration handoff documents
│   ├── research/                  # Layout proposals, tech research
│   └── specs/                     # Product spec, production plan
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── api/                   # API route handlers
│   │   │   ├── health/route.ts    # GET /api/health
│   │   │   ├── agents/route.ts    # GET /api/agents
│   │   │   ├── projects/route.ts  # GET /api/projects
│   │   │   ├── integrations/route.ts  # GET /api/integrations
│   │   │   └── tasks/route.ts     # GET /api/tasks
│   │   ├── dashboard/             # Mission Control dashboard
│   │   ├── integrations/          # Connected systems view
│   │   ├── agents/                # Agent fleet view
│   │   ├── projects/              # Projects/work view
│   │   ├── tasks/                 # Task queue view
│   │   ├── settings/              # White-label configuration
│   │   ├── layout.tsx             # Root layout (TooltipProvider)
│   │   ├── page.tsx               # Redirects to /dashboard
│   │   └── globals.css            # Tailwind + shadcn theme
│   ├── components/
│   │   ├── shell/                 # App shell (sidebar, header, layout)
│   │   ├── r3f/                   # React Three Fiber scenes
│   │   └── ui/                    # shadcn/ui primitives
│   └── lib/
│       ├── fixtures/              # Sample data (agents, projects, etc.)
│       ├── theme.ts               # White-label brand tokens
│       └── utils.ts               # cn() utility
├── tests/                         # Test directory (Playwright/Vitest)
├── package.json
└── tsconfig.json
```

## API Endpoints

All endpoints return JSON. Fixture-backed (no database required).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | System health check |
| GET | `/api/agents` | Agent fleet list |
| GET | `/api/projects` | Project list |
| GET | `/api/integrations` | Connected systems |
| GET | `/api/tasks` | Task queue |

Example:

```bash
curl http://localhost:3000/api/health
# {status:ok,version:0.1.0,timestamp:...,uptime:...}

curl http://localhost:3000/api/agents
# {data:[...],count:5}
```

## White-Label Tokens

Branding is configured in `src/lib/theme.ts`. Customers override:

- `theme.brand.name` — display name
- `theme.brand.shortName` — sidebar abbreviation
- `theme.brand.logoUrl` — logo path
- `theme.colors.brand` — primary brand color
- `theme.colors.sidebar*` — sidebar theme colors
- `theme.colors.status*` — status indicator colors

## R3F Scene

The Dashboard includes a minimal React Three Fiber canvas (`MissionControlScene`) showing:
- A central pulsing sphere (system core)
- Orbiting node cluster (agent activity)
- Connecting lines between nearby nodes
- OrbitControls for drag/zoom interaction

## Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/dashboard` |
| `/dashboard` | Mission Control — KPIs, 3D graph, recent activity |
| `/integrations` | Connected systems and services |
| `/agents` | Agent fleet status and details |
| `/projects` | Strategic projects by game |
| `/tasks` | Operational task queue |
| `/settings` | White-label branding and system config |

## Iteration History

| Iteration | Date | Description | Commit |
|-----------|------|-------------|--------|
| I0 | 2026-07-15 | Foundations scaffold — Next.js + shadcn + R3F + API stubs | (see git log) |

## Remote

No remote configured. When available:

```bash
git remote add origin <ssh-url>
# or via system: agictl project update 26 --remote <ssh-url>
```

## Docs

| Document | Path |
|----------|------|
| Product Specification | [docs/specs/PRODUCT_SPECIFICATION.md](docs/specs/PRODUCT_SPECIFICATION.md) |
| Production Plan | [docs/specs/PRODUCTION_PLAN.md](docs/specs/PRODUCTION_PLAN.md) |
| Layout Proposal | [docs/research/LAYOUT_PROPOSAL.md](docs/research/LAYOUT_PROPOSAL.md) |
| Research | [docs/research/RESEARCH.md](docs/research/RESEARCH.md) |
