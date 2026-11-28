<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Versa - Business Admin — agent door

Product name is **Versa - Business Admin** (VBA). This file is the product door for agents working in this repo.

If you are COA in a Versa AGi IDE folder (`/home/coa/coa-env`), the host handshake is that folder’s `AGENTS.md`. Do not copy host AGi handshake rules into this repo.

Host install/orient: Versa AGi skill **`business_admin`** (`coa_only`). Host API / operate / local enhance: **`business_admin_operate`**. Those skills **point here**. Do not invent a third host skill id for this product.

## Load first

| Need | Path |
|------|------|
| **What VBA can already do** (read before building or scripting anything new) | `docs/agents/capabilities.md` |
| Operator / restart / upgrades | `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md` |
| Forms, listings, Spatial Twin, stale UI | `docs/ops/WORKING_WITH_VBA.md` |
| Staff how-to | `docs/ops/BUSINESS_ADMIN_USER_MANUAL.md` |
| HTTP API catalog | `GET /api` (open) and Settings → API |
| Doing work over the API (records, lines, job costing, shipments, printing, attachments, statistics) | `docs/agents/README.md` |
| Integrations between installs, access tokens (1.0.20) | `docs/agents/integrations.md` |
| Designing a change or a new capability (a brief, a spec) | `docs/agents/extending.md` — the state docs in `docs/production/state/` are senior to any brief |

## First run

A new install ships with **demo mode on** (`demo_mode: true`). Turn it off in Settings → Modes before real use. Turning it off deletes the sample pack. The Primary Org and the install accounts stay.

The first boot also installs the **site pack**: the Versa AGi Primary slides, the Versa page canvases (story, three chapters, two comparisons, founder; 1.0.19), their styles, and menus (`ba_site:` records, `src/lib/site-pack/site-pack.json`). Demo off never removes them. On every start, an upgraded install receives the release's new pack pages and canvases once, and pack pages or canvas settings still exactly as an earlier release shipped them are updated; anything edited on the install is kept (1.0.19, Ops Manual §5.2.16). The site lives in Postgres (`site_settings.body`); scripts that change settings must call `hydrateSiteSettings()` first.

## Standing product rules

- This checkout is pull-only. Do not commit product changes and do not `git push`. The Primary User publishes `main`.
- Hide leftover catalog fields (`active: false`). Do not delete system fields or invent a second meaning for an old `api_name`.
- Agents are a **user type** (`human` | `agent`). No agent-fleet chrome. List agents with `GET /api/users?type=agent`.
- Talk to VBA over HTTP or Script Tasks. Do not share the host Versa AGi database.
- Restart: exact PID from `ss -tlnp`, then rebuild when the running process must show the change. Health: `curl -sS localhost:<port>/api/health` in its own call. Never `pkill -f`.
- Compatibility aliases / deprecation fallbacks: not until the Primary User asks (allowed from **v1.0.0**). Overlay-read folds in `name-aliases.ts` are not HTTP aliases.

## Host vs repo

| Lives here (git) | Stays on the Versa AGi host |
|------------------|-----------------------------|
| This `AGENTS.md` | Host handshake `AGENTS.md` (IDE mode) |
| `docs/ops/*` manuals | `business_admin` + `business_admin_operate` |
