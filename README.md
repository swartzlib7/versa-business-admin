# versa-admin-system

**Versa AGi Mission — business Mission Control** for a Versa AGi-powered business.

Standalone, distributable product that customers install/use with their Versa AGi system so **business staff** can run the business: public presence, people, work, organization, collaboration parties, and environmental context.

**Not agitop.** agitop is the Versa AGi **internal** operator console (Agents, host Projects/Tasks, host Organization, system ops). This product is mission control for the **business**.

| | |
|--|--|
| **Project ID** | 26 |
| **Game** | #109 Versa Voice AI LLC |
| **Phase** | Building — I0–I6 + I5.x on **beta**; ERD keystone v1.1 locked |
| **Remote** | `git@github.com:swartzlib7/versa-agi-mission.git` |
| **Branches** | `master`, `beta`, `agent/coa`, `agent/web-dev` |

## Product boundaries (short)

- **Own** database/ERD (fixtures today → real store later).
- Secure **login + RBAC**.
- **Public** site when signed out.
- **Agents = user type only** (`human` | `agent`). No agent-management chrome.
- Data created here is **separate** from host Versa AGi; integrate via **product API** or Script Tasks.
- **agitop Organization** may be turned off when using this product’s Organization model; migration is future/out of scope.

Full rules: `docs/specs/PRODUCT_SPECIFICATION.md`  
**3D / zone ERD source of truth:** `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md`

## Conceptual ERD (keystone v1.1)

Three zones (circles):

1. **Organization** — departments as spheres: Executive, Communications, Dissemination, Treasury, Production, Qualification  
2. **Collaboration** — Vendor (Service Provider), Customer, Partner, Branch (Subsidiary)  
3. **Environmental** — Locations (address book), Events, Knowledge, Schedules, Product, Service  

Nav intent: **Projects/Tasks → Executive**; **Integrations → Product**; Active Agents / Agent Status **fall away**.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React + Next.js (App Router) |
| 3D | React Three Fiber + drei |
| Styling | Tailwind + shadcn/ui |
| Language | TypeScript |
| API | Route Handlers + data adapter (fixtures) |

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000  (dev often :3100 in our smoke setup)
npm run build && npm start
```

## Docs map

| Path | Role |
|------|------|
| `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` | **Canonical** 3D/zone ERD + glossary + agitop boundary |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Product essence, spine, non-goals |
| `docs/specs/PRODUCTION_PLAN.md` | Iteration status; I5.5 gated; I7 closed |
| `docs/api/API_CONTRACT.md` | HTTP API contract |
| `docs/handoffs/ITERATION_*_WEB_DEV.md` | Historical / active build briefs (**not** at workspace root) |
| `docs/_notes/from_stephen.md` | Binding early boundaries note |
| `docs/_notes/ALIGNMENT_CHECKLIST.md` | Acceptance checklist |
| `docs/research/LAYOUT_PROPOSAL.md` | **Superseded** seed — do not implement |

## Current build status (high level)

| Area | Status |
|------|--------|
| Public site + facets | Done (I4 / I5.x) |
| Auth + RBAC + Users | Done (I5) |
| Projects + Tasks | Done (I6) |
| 3D hub viz | Done transitional (I5.4 / I5.4.1) — **not yet keystone nodes** |
| Keystone ERD in UI/nav | **I5.5 not opened** |
| Organization hierarchy I7 | **Closed** |
| Own SQL DB | Not started |

## API (summary)

See `docs/api/API_CONTRACT.md`. Prefer business resources: `users`, `roles`, `projects`, `tasks`, public `*`. Legacy `/api/agents*` naming is **deprecated** transitional alias of users with `type=agent` — do not expand agent-fleet semantics.

## White-label

Branding tokens in `src/lib/theme.ts` (including hub name **Versa AGi** for Mission Control viz). Public sample may still use Northstar-style placeholder content by design.

## Workflow

1. Product work on `agent/coa` or `agent/web-dev`  
2. COA accepts → merge to **`beta`**  
3. Stephen promotes **`beta` → `master`** when ready  

web-dev stands by for **I5.5** (keystone implementation) only when explicitly tasked. **I7** stays closed until Stephen opens it.

## System information (product requirement)

Ship help/about copy that this app is business Mission Control, agents are only a user type, agitop owns agent ops, and agitop Organization can be disabled when using this product.

---

*Packaging and distribution into Versa AGi are owned by Stephen.*
