# versa-admin-system

**Versa AGi Mission — business Mission Control** for a Versa AGi-powered business.

Standalone, distributable product that customers install/use with their Versa AGi system so **business staff** can run the business: public presence, people, work, organization, collaboration parties, and environmental context.

**Not agitop.** agitop is the Versa AGi **internal** operator console (Agents, host Projects/Tasks, host Organization, system ops). This product is mission control for the **business**.

| | |
|--|--|
| **Project ID** | 26 |
| **Game** | #109 Versa Voice AI LLC |
| **Phase** | Building — I0–I6 + I5.x through **I5.6** on **beta** (package **v0.7.45**) |
| **Remote** | `git@github.com:swartzlib7/versa-agi-mission.git` |
| **Branches** | `master`, `beta`, `agent/coa`, `agent/web-dev` |
| **HEAD (beta)** | I5.6.29 docs statefold zone ERD; hub code through I5.6.28 |

## Product boundaries (short)

- **Own** database/ERD (fixtures today → real store later).
- Secure **login + RBAC**.
- **Public** site when signed out.
- **Agents = user type only** (`human` | `agent`). No agent-management chrome.
- Data created here is **separate** from host Versa AGi; integrate via **product API** or Script Tasks.
- **agitop Organization** may be turned off when using this product’s Organization model; migration is future/out of scope.

Full rules: `docs/specs/PRODUCT_SPECIFICATION.md`  
**Open first:** `docs/production/state/shape_mission_control.md`  
**3D / zone ERD:** `docs/production/state/state_i5_6_zone_erd.md`

## Conceptual ERD (keystone)

Three zones (circles):

1. **Organization** — departments as spheres: Executive, Communications, Dissemination, Treasury, Production, Qualification  
2. **Collaboration** — Vendor (Service Provider), Customer, Partner, Branch (Subsidiary)  
3. **Environmental** — Locations (address book), Events, Knowledge, Schedules; Product/Service owned under Organization/Production per I5.6 IA  

Nav intent: **Projects/Tasks → Executive**; **Integrations → Vendor/Product path**; Active Agents / Agent Status **fall away**.

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
| `docs/production/state/shape_mission_control.md` | **Map — open this first** |
| `docs/production/state/state_*.md` | Living feature states (one per unit) |
| `docs/coa/MISSION_CONTROL_PRODUCTION_PLAN.md` | Horizons / roadmap |
| `docs/ops/MISSION_CONTROL_OPS_MANUAL.md` | Ops outline (setup / maintain / upgrade) |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Product essence, spine, non-goals |
| `docs/GIT_WORKFLOW.md` | Branch model |
| `docs/api/API_CONTRACT.md` | **Stub** → `state_api_contract.md` |
| `docs/specs/*` ERD / zone / baseline files | **Stubs** → `state_i5_6_zone_erd.md` |
| `docs/research/*` | **Stubs** → layout / ERD states |
| `docs/handoff/` · `docs/handoffs/` | **Stubs** → `__archive/handoffs/` |
| `docs/_notes/from_stephen_*.md` | Binding early boundary notes |

## Current build status (high level)

| Area | Status |
|------|--------|
| Public site + facets | Done (I4 / I5.x) |
| Auth + RBAC + Users | Done (I5) |
| Projects + Tasks | Done (I6) |
| Keystone zones in 3D + nav | Done through **I5.5.x**; hub polish **I5.6** through **I5.6.28** (v0.7.45) |
| Zone ERD + baseline docs | Living statefold **I5.6.29**; formal baseline lock still open |
| Organization hierarchy I7 | **Closed** until Stephen opens |
| Own SQL DB | Not started (JSON-in-DB direction locked for flexible attrs) |

## API (summary)

See **`docs/production/state/state_api_contract.md`**. Prefer business resources: `users`, `projects`, `tasks`, public `*`. Legacy `/api/agents*` naming is **deprecated** transitional alias of users with `type=agent` — do not expand agent-fleet semantics.

Package version **0.7.45**; API index label may still report **0.4.0** (capability series) while health tracks package version — see API state doc.

## White-label

Branding tokens in `src/lib/theme.ts` (including hub name **Versa AGi** for Mission Control viz). Public sample may still use Northstar-style placeholder content by design.

## Workflow

1. Product work on `agent/coa` or `agent/web-dev`  
2. COA accepts → merge to **`beta`**  
3. Stephen promotes **`beta` → `master`** when ready  

web-dev stands by unless explicitly tasked. **I7** stays closed until Stephen opens it. Hub visual experiments only with explicit direction.

## System information (product requirement)

Ship help/about copy that this app is business Mission Control, agents are only a user type, agitop owns agent ops, and agitop Organization can be disabled when using this product.

---

*Packaging and distribution into Versa AGi are owned by Stephen.*
