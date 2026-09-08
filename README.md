# Versa - Business Admin (VBA)

**Formal name:** Versa - Business Admin  
**Acronym:** VBA  
**Shipped directory:** `Versa-BusinessAdmin`  
**GitHub:** `git@github.com:swartzlib7/versa-business-admin.git` (public production repo)

Standalone, distributable product that a Versa AGi-powered business installs so **staff** can run the business: public presence, people, work, organization, collaboration parties, and environmental context.

**Not agitop.** agitop is **Versa AGi - Mission Control**, the Versa AGi **internal** operator console (Agents, host Projects/Tasks, host Organization, system ops). VBA is the **business** admin system.

| | |
|--|--|
| **Project ID** | 26 |
| **Game** | #109 Versa Voice AI LLC |
| **Phase** | Building — unlaunched (compatibility aliases start at **v1.0.0**) |
| **Package** | See `package.json` / `GET /api/health` |
| **Review host** | `:3200` |
| **Remote** | `git@github.com:swartzlib7/versa-business-admin.git` |
| **Branches** | `master`, `beta`, `agent/coa`, `agent/web-dev` |

---

## Start here

| Who | What to open | How to use it |
|-----|----------------|---------------|
| **Humans** (operators, installers, reviewers) | **[User / Operations Manual](docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md)** | Setup, login, roles, day-2 care, restarts, upgrades. Read §0 then §2. |
| **Agents** on a Versa AGi host | **COA skill `business_admin`** — host file `.agent/skills/business_admin.md` | Load the skill. First establish whether VBA is already installed on this host; then clone/install or continue from the existing instance. |
| **Everyone** | This README | Product name, roles, quick start, docs map. |

The skill does **not** live inside this product repo. It lives on the Versa AGi host as a **COA-only** skill. The User Manual **does** live here (`docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md`) and is the human source of truth the skill points at.

---

## Roles — Admin vs member

There is **one login page** (`/login`). Admin and member do not use different login screens. The difference is the **`role` on the user record** after a session is created (`admin` | `member`).

| | Administrator | Member |
|--|---------------|--------|
| Who | Workspace operators | Staff who work inside VBA |
| Session | `role === "admin"` (`isAdmin` in `src/lib/auth.ts`) | Authenticated, not admin |
| Typical access | Read + write: users, catalog, settings, sample data, organizations, projects, tasks, records | Read most resources; limited writes (self profile; assignee task status) |
| Cannot | — | Create users; change another user’s role/type/status; admin-only settings and sample-data mutations |

Install always creates **exactly two** administrator accounts:

1. **Administrator** (human) — `admin@example.com`
2. **COA** (agent) — `coa@example.com`, type `agent`, role `admin`

On first backend login, change both passwords. While **Demo mode** is on, `/login` shows those install emails/passwords (they may already have been changed) plus an alert to change them. The hint box is hidden when Demo mode is off.

Everyone else (Jordan, Casey, Riley, Ops Assistant, Research Assistant, …) is **sample data**, inserted from Settings → Modes → Insert Sample Data and removed by Delete Sample Data.

Full operator detail: User Manual **§1.5**. API `auth` labels: `session` / `admin` / `admin-or-self` / `admin-or-assignee` in Settings → API.

---

## Product boundaries (short)

- **Own** database/ERD (Postgres via `.env.local`; fixture is opt-in for tests).
- Secure **login + RBAC** (same form; role after login).
- **Public** site when signed out.
- **Agents = user type only** (`human` | `agent`). No agent-fleet chrome. List agents with `GET /api/users?type=agent`.
- Data created here is **separate** from host Versa AGi; integrate via **product API** or Script Tasks.
- **Host Organization migrate:** `scripts/migrate_agi_org.mjs`. Do not disable agitop Organization unless the Primary User asks after a verified migrate.

**Open first:** `docs/production/state/shape_business_admin.md`  
**User Manual:** `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md`  
**Installation skill (host):** `.agent/skills/business_admin.md`  
**3D / zone ERD:** `docs/production/state/state_i5_6_zone_erd.md`

## Conceptual ERD (keystone)

Three zones (circles):

1. **Organization** — departments as spheres: Executive, Communications, Dissemination, Treasury, Production, Qualification
2. **Collaboration** — Vendor (Service Provider), Customer, Partner, Branch (Subsidiary)
3. **Environmental** — Locations (address book), Events, Knowledge, Schedules; Product/Service owned under Organization/Production per I5.6 IA

Nav intent: **Projects/Tasks → Executive**; **Integrations → Vendor/Product path**.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React + Next.js (App Router) |
| 3D | React Three Fiber + drei |
| Styling | Tailwind + shadcn/ui |
| Language | TypeScript |
| API | Route Handlers + data adapter (fixtures or Postgres) |

## Quick start

```bash
git clone https://github.com/swartzlib7/versa-business-admin.git Versa-BusinessAdmin
cd Versa-BusinessAdmin
git checkout beta
npm ci
cp .env.example .env.local   # edit locally — never commit secrets
npm run build
# Review host often :3200 — kill the exact PID from ss -tlnp | grep 3200 (never pkill -f)
npx next start -p 3200
```

Verify with `curl -s localhost:3200/api/health` (root `/` may stall — do not relaunch on timeout).

Humans: continue in the **User Manual** §2.  
Agents: load skill **`business_admin`** and follow it.

Install login (pre-launch fixture password `mission2026`, shown on `/login` only while Demo mode is on — passwords may have been changed):

- Administrator (human): `admin@example.com`
- COA (agent): `coa@example.com`

## Docs map

| Path | Role |
|------|------|
| `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md` | **User / ops manual** — humans start here |
| `.agent/skills/business_admin.md` | **COA installation skill** (Versa AGi host, not this repo) |
| `docs/production/state/shape_business_admin.md` | Feature map — open this first for living states |
| `docs/production/state/state_*.md` | Living feature states (one per unit) |
| `docs/coa/BUSINESS_ADMIN_PRODUCTION_PLAN.md` | Horizons / roadmap |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Product essence, spine, non-goals |
| `docs/GIT_WORKFLOW.md` | Branch model |
| `docs/api/API_CONTRACT.md` | Stub → `state_api_contract.md` |
| `docs/production/state/state_api_contract.md` | HTTP API living contract |
| Settings → **API** / `GET /api` | This version’s route catalog |

## API (summary)

See **`docs/production/state/state_api_contract.md`**. Prefer business resources: `users`, `projects`, `tasks`, public facets. Agents are a user type — `GET /api/users?type=agent`. There are **no** compatibility aliases before v1.0.0.

`GET /api` and Settings → API share `src/lib/api/inventory.ts`. Version matches `package.json`.

## White-label

Branding tokens in `src/lib/theme.ts` (product label **Versa - Business Admin** / **VBA**). Public sample may still use placeholder tenant content by design.

## Workflow

1. Product work on `agent/coa` or `agent/web-dev`
2. COA accepts → merge to **`beta`**
3. Stephen promotes **`beta` → `master`** when ready

web-dev stands by unless explicitly tasked. **I7** stays closed until Stephen opens it. Hub visual experiments only with explicit direction.

Compatibility aliases / deprecation fallbacks: **not used** until launch; Stephen will ask from **v1.0.0** onward.

---

*Packaging and distribution into Versa AGi are owned by Stephen.*
