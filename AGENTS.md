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
| Operator / restart / upgrades | `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md` |
| Forms, listings, Spatial Twin, stale UI | `docs/ops/WORKING_WITH_VBA.md` |
| Staff how-to | `docs/ops/BUSINESS_ADMIN_USER_MANUAL.md` |
| HTTP API catalog | `GET /api` (open) and Settings → API |

## First run

A new install ships with **demo mode on** (`demo_mode: true`). Turn it off in Settings → Modes before real use. Turning it off deletes the sample pack. The Primary Org and the install accounts stay.

The first boot also installs the **site pack**: the Versa AGi Primary slides, the Analysis canvas, their styles, and menus (`ba_site:` records, `src/lib/site-pack/site-pack.json`). Demo off never removes them. The site lives in Postgres (`site_settings.body`); scripts that change settings must call `hydrateSiteSettings()` first.

## Standing product rules

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
