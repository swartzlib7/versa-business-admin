# Versa - Business Admin — Operations Manual (User Manual)

**Product:** Versa - Business Admin (VBA)  
**Repo / project:** `Versa-BusinessAdmin` · Project **#26**  
**Audience:** Agents and humans implementing, hosting, maintaining, and upgrading VBA  
**Status:** Living — D3/D5 landed; HTTP API catalog 0.7.145; skill `business_admin` linked (§2.0). Remaining *TBD*: production packaging + post-deploy smoke script. Host snapshot in §4.4 may lag HEAD.  
**Governing design:** `docs/production/state/state_upgradability.md` (D1–D6 **locked**)  
**Map:** `docs/production/state/shape_business_admin.md`  
**Roadmap:** `docs/coa/BUSINESS_ADMIN_PRODUCTION_PLAN.md` — Horizon 3  
**Task:** #240 / follow-on #278  
**Agent skill:** `business_admin` — host file `.agent/skills/business_admin.md` (Versa AGi, scope all). What it covers is summarized in §2.0.  

> **Do not invent upgrade runbooks that contradict seed-only v1 (D4) or other locked D1–D6 decisions.**

---

## 0. How to use this manual

| You need to… | Go to |
|--------------|--------|
| Understand what this product is / is not | §1 |
| Understand Admin vs member (same login) | §1.5 |
| Enable via Versa AGi setup / agent install | §2.0 + skill `business_admin` |
| Install or boot a dev/review instance | §2 |
| Use the HTTP API (this version) | §2.9 + `GET /api` + Settings → API |
| Day-2 care (logs, health, stale UI) | §3 |
| Ship a code change safely (gates, branches, ports) | §4 |
| Apply a product version upgrade (tenant-safe) | §5 |
| Operate data/catalog/backups | §6 |
| Troubleshoot common failures | §7 |
| Know open gaps / what not to do yet | §8 |

Related living docs (do not duplicate ERD/UX here):

| Doc | Role |
|-----|------|
| `README.md` | Product name, roles, User Manual + skill usage |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Boundaries vs agitop |
| `docs/production/state/shape_business_admin.md` | Feature map — open first |
| `docs/production/state/state_i5_6_zone_erd.md` | Zone ERD |
| `docs/production/state/state_api_contract.md` | HTTP API |
| `docs/production/state/state_layout_mission_ui.md` | Shell / IA |
| `docs/production/state/state_records_editor_ux.md` | Records Editor / layouts |
| `docs/production/state/state_db_cutover_checklist.md` | DB cutover |
| `docs/production/state/state_upgradability.md` | Upgrade model D1–D6 |
| `docs/coa/BUSINESS_ADMIN_PRODUCTION_PLAN.md` | Horizons / roadmap (skill is Horizon 3 #4) |
| `docs/ops/STALE_UI_AND_DEPLOY.md` | Stale `.next` / cache incidents |
| `docs/GIT_WORKFLOW.md` | Branch model |
| Versa AGi skill `business_admin` | Agent install / API procedure (`.agent/skills/business_admin.md`) |

---

## 1. Product identity (operators)

### 1.1 What it is

Standalone **Versa - Business Admin** for a Versa AGi-powered business: public presence, people, work, organization, collaboration parties, environmental context.

On **this** Versa AGi host, project #26 is the **development** instance — we build, test, and deploy from here. **Production will be remote** (a separate Versa AGi instance). Review `:3200` is not production.

### 1.2 What it is not

| Not this | That lives in… |
|----------|----------------|
| Host agent fleet / Active Agents chrome | **agitop** / Versa AGi internal |
| Shared schema with host Projects/Tasks | Host AGi — integrate via **product API** or Script Tasks |
| ERPNext / Odoo adoption | Path A locked: build on Next.js shell |

Agents are only a **user type** (`human` | `agent`).

### 1.3 Stack (current)

| Layer | Choice |
|-------|--------|
| UI | React + Next.js App Router |
| 3D | React Three Fiber + drei |
| Style | Tailwind + shadcn/ui |
| Language | TypeScript |
| Data | Route handlers + adapter (fixtures → Postgres/Drizzle path in progress) |
| Package (beta HEAD reference) | See `package.json` / `/api/health` `version` |

### 1.4 Three-layer upgrade mental model

1. **System code** — replaced by release  
2. **Tenant config (catalog)** — merged per D1–D6  
3. **Tenant data** — never destroyed by product seeds  

Full rules: `state_upgradability.md`.

### 1.5 Admin vs member (same login)

There is **one** login page. Admin and member are not different apps or different URLs.

| | Administrator | Member |
|--|---------------|--------|
| Stored as | `users.role = admin` | `users.role = member` |
| Code | `isAdmin(session)` in `src/lib/auth.ts` | Authenticated, not admin |
| Writes | Catalog, settings, sample data, users, orgs, projects, tasks, records | Self profile (not role/type/status); assignee can update task status |
| Install accounts | One human (`admin@example.com`) and one agent COA (`coa@example.com`) | Extra people come from **Insert Sample Data** only |

API catalog `auth` column: `open` / `session` / `admin` / `admin-or-self` / `admin-or-assignee`. Compatibility aliases are not used before **v1.0.0**.

**First login (Demo mode):** `/login` shows an alert to change the Administrator (human) and COA (agent) passwords. The install email/password hint box appears **only while Demo mode is on**, and says passwords may have been changed. After sign-in the same reminder sits in the operator shell until Demo mode is turned off (Settings → Modes). Change passwords on **Users**.

Also in root `README.md` (Roles).

---

## 2. Setup

### 2.0 Agent install (skill `business_admin`)

COA loads the Versa AGi skill **`business_admin`** (`.agent/skills/business_admin.md`, **COA-only**). This manual is what that skill points at. The skill’s first step is **whether VBA is already installed on this host**; only then clone/install or continue.

**Versa AGi setup (intended):** setup asks whether Versa - Business Admin should be enabled. If yes, it registers a Project whose description carries the public GitHub URL and these four instructions:

1. Clone `https://github.com/swartzlib7/versa-business-admin.git` (branch `beta`).
2. Read this ops manual.
3. Run the installation in §2.2–§2.6.
4. Implement against the HTTP API (`GET /api`, Settings → API).

Example Project registration (COA / setup) — skip if the Project already exists:

```bash
agictl project add versa-business-admin \
  --desc "Versa - Business Admin (VBA). Clone https://github.com/swartzlib7/versa-business-admin.git Versa-BusinessAdmin (beta). Read docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md. Run the install in manual §2. Implement against GET /api." \
  --remote git@github.com:swartzlib7/versa-business-admin.git
```

This host already has that Project as **#26** (`Versa-BusinessAdmin`). Do not register a duplicate.

**What the skill covers** (do not duplicate the full procedure here):

| Topic | In the skill |
|-------|----------------|
| Orient | Installed already? Project, workspace, health — then install or continue |
| Enablement / Project payload | Setup prompt → `agictl project add` with public URL + the four instructions |
| Clone + boot | Public HTTPS or SSH, `beta`, `npm ci`, `.env.local`, build, start, health |
| API | `GET /api` catalog, Settings → API, conventions, `c_` / `ba_sample:` |
| D1–D6 | Seed-only upgrades, overlay, hide-not-delete, agent packages |
| Day-2 | Exact-PID restart, backups, stale UI; first-host install §2.8 |

When the Primary User asks COA to install or implement Versa - Business Admin, COA loads `business_admin` and executes it.

### 2.1 Prerequisites

- Node.js compatible with the repo lockfile (use version CI/local team standard; do not freestyle major bumps without Stephen)
- npm
- Git + access to the public repo `https://github.com/swartzlib7/versa-business-admin` (SSH `git@github.com:swartzlib7/versa-business-admin.git` also fine)
- Optional Postgres when leaving pure fixtures (`scripts/vagrant-postgres.sh`, `npm run db:*`)
- Host OS note (this installation): Ubuntu 24.04 native_linux

### 2.2 Clone and install

```bash
git clone https://github.com/swartzlib7/versa-business-admin.git Versa-BusinessAdmin
# or: git clone git@github.com:swartzlib7/versa-business-admin.git Versa-BusinessAdmin
cd Versa-BusinessAdmin
git checkout beta      # integration / review line
npm ci                 # prefer ci when lockfile present
cp .env.example .env.local   # then edit secrets — never commit .env.local
```

### 2.3 Environment

Use `.env.example` as the contract. Typical keys (confirm against current example):

- Database URL when Postgres enabled  
- Auth/session secrets  
- Any public URL / allowed dev origins for LAN testing  

**Rule:** secrets stay host-local; agents must not paste secrets into chat.

### 2.4 Database (when enabled)

```bash
npm run db:start      # or status/health first
npm run db:migrate
npm run db:seed       # seed-only baseline — respects future D4 posture
npm run db:studio     # optional
```

Scripts: `scripts/vagrant-postgres.sh`, `scripts/seed.mjs`.  
Deep checklist: `state_db_cutover_checklist.md`.

### 2.5 Run modes

| Mode | Command | Use |
|------|---------|-----|
| Dev (HMR) | `npx next dev --port <port>` or `npm run dev` | Active UI development / Gate 3 review on this host often **:3200** |
| Production-like | `npm run build && npx next start -p <port>` | Stale-UI-sensitive; must rebuild+restart every deploy |
| Lint / types | `npm run lint`, `npx tsc --noEmit` | Gate 1 evidence |

### 2.6 First-boot verification checklist

- [ ] `git rev-parse --short HEAD` is the intended SHA  
- [ ] `npm run build` succeeds (for prod-like) **or** dev server clean start  
- [ ] `GET /login` → 200  
- [ ] `GET /api/health` → JSON `status=ok` with `version` and optional DB block  
- [ ] Sign-in works with known test user (from seed/fixtures)  
- [ ] Change Administrator + COA passwords (Demo-mode alert on `/login` and in the backend shell)  
- [ ] Hard-refresh browser once after first load  

### 2.7 Multi-instance / port map (this host — living)

| Port | Role (current practice) |
|------|-------------------------|
| **3200** | Primary Stephen Gate 3 / beta review — production-mode `next start` since 2026-09-04 (rebuild+restart every deploy) |
| **3100** | Historically production-like review board (`next start`) — may be down |
| **3210** | Scratch / worktree experiments — do not treat as Gate 3 |

Update this table when ports change; do not assume README alone is current.

### 2.8 Customer / greenfield install (*TBD expand*)

Outline only until packaging exists:

1. Provision host + Node + reverse proxy (HTTPS)  
2. Deploy immutable artifact (image or SHA-named build dir)  
3. Configure env + empty durable store  
4. Run migrations + **system seed** (not tenant data clone)  
5. Create the two install administrator accounts (human Administrator + agent COA)  
6. Health + smoke  
7. Optional: turn off agitop Organization if using MC Organization model (product boundary)

### 2.9 HTTP API (this version)

The product HTTP API is complete for the 0.7.142 feature set.

| Surface | What it is |
|---------|------------|
| `GET /api` | Open JSON index: package version, `docs` links, full `resources[]` |
| Settings → **API** | Operator view of the same catalog |
| `docs/production/state/state_api_contract.md` | Living contract (points at `src/lib/api/inventory.ts`) |
| `GET /api/health` | Process + DB health; `version` matches `package.json` |

Agents implementing integrations start at `GET /api`. Public System Landscape: `/api/public/system-landscape`. Agents are users: `GET /api/users?type=agent`. No compatibility aliases before v1.0.0. Admin vs member: §1.5.

### 2.10 Host Organization migrate (`migrate_agi_org`)

Script: `scripts/migrate_agi_org.mjs` (`npm run migrate:agi-org`).

- Default **dry-run** — reads host `agictl organization` and prints the mapping + integrations that would turn off on a production cutover.
- `--apply --base http://localhost:3200` writes mapped orgs into this VBA instance (idempotent via `data.external_id` / `data.agi_org_id`). Fixture-mode orgs are **in-memory** until restart.
- Does **not** copy credential secrets. Does **not** write products, invoices, or estimates this pass (Production / Treasury still deferred).
- `--disable-host-org` is **refused** on this development host — the live Organization module (Wave sync) stays on until a planned remote production cutover.

On cutover (not this host): Wave Accounting becomes a VBA vendor + integration instance; stop the host Wave→org.db sync; then disable agitop Organization so both catalogs do not own the same parties.

---

## 3. Maintenance (day-2 operations)

### 3.1 Health monitoring

```bash
curl -s http://127.0.0.1:3200/api/health
# expect status ok; note version, uptime, database.connected
```

Alert when: non-200, `status!=ok`, DB disconnected, version ≠ expected release.

### 3.2 Logs

- Dev: process stdout / `.logs/` if present  
- Prod-like: process manager journal (systemd/pm2/docker logs)  
- Do not commit log dumps into git  

### 3.3 Dependency and lockfile hygiene

- Change dependencies only in an explicit slice with Gate 1 build proof  
- Prefer `npm ci` on clean agents/CI  
- Never force major Next/React bumps mid Gate 3 batch  

### 3.4 Stale UI prevention (mandatory)

From `STALE_UI_AND_DEPLOY.md`:

**Problem A — frozen production build:** `next start` serves last `.next`; git checkout alone does nothing.  
**Fix:** `npm run build` then restart process; confirm `.next` mtime ≥ commit time.

**Problem B — browser HTML cache:** hard-refresh once; HTML routes should be `no-store`.

**Never-again before visual OK:**

1. HEAD SHA matches slice  
2. `.next` newer than commit (prod-like) **or** dev server restarted after pull  
3. Process start after build  
4. Health 200 + version fingerprint  
5. Browser hard-reload  
6. Smoke locked acceptance points  

### 3.5 Process lifecycle (review host)

```bash
# Example: restart Gate 3 dev board on 3200 (adjust if process manager changes)
# 1) identify PID: ss -tlnp | grep 3200  (kill that PID; never pkill -f — it self-matches)
# 2) cd repo && git checkout beta && git pull --ff-only
# 3) rm -rf .next   # when switching SHAs or after bad build
# 4) npm run build
# 5) nohup ./node_modules/.bin/next start -p 3200 > __tmp/next3200.log 2>&1 &
# 6) verify in a SEPARATE call: curl -s localhost:3200/api/health  (root may stall; never relaunch on timeout)
```

### 3.6 Credentials & host permissions (AGi co-hosting)

When Versa - Business Admin shares a Versa AGi host with agents:

- Workspace dirs that agents must read: group `agi_agents`, avoid `coa:coa` 660 on shared secrets  
- Never world-readable credentials  
- Script Tasks run as `assigned_to` OS user — state files need group-writable dirs  

(Operational lesson 2026-08-18: email-access + PH state paths.)

### 3.7 Backups (*TBD deepen with durable catalog*)

| Asset | v1 guidance |
|-------|-------------|
| Git | Remote is source of truth for code |
| `.env.local` | Host backup only; encrypted |
| Postgres (DATA_SOURCE=postgres) | Scheduled `pg_dump` — includes `catalog_overlay` + zone tables (`executive_project`, `executive_task`, `production_product`) |
| Durable catalog overlay (fixture mode) | `.data/catalog.json` IS the tenant customization store when no DB — back up the file |
| Overlay restore rule | Restore must not re-seed wipe `c_*`; seed∪overlay merge on boot makes system seed re-runnable, overlay must survive |
| Sample data | Rows tagged `ba_sample:`; insert/delete via Settings → Modes — never hand-delete the Primary Org |
| Fixture-only dev | Disposable; do not treat as production data |

---

## 4. Change delivery (development operations)

### 4.1 Branch model

| Branch | Purpose |
|--------|---------|
| `master` | Stable — promote from `beta` only with Stephen (or explicit COA promote) |
| `beta` | Integration / demos / Gate 3 |
| `agent/coa` | COA docs/orchestration |
| `agent/web-dev` | Implementation |

Flow: agent branch → COA Gate 2 → fast-forward **beta** → Stephen Gate 3 → later **master**.

### 4.2 Gate protocol (current practice)

| Gate | Owner | Meaning |
|------|-------|---------|
| **Gate 1** | web-dev | Scope complete; `tsc` + `build` clean; commit on `agent/web-dev`; evidence to COA |
| **Gate 2** | COA | Scope-only review; beta FF; review port restart; hold web-dev |
| **Gate 3** | Stephen | Visual/product accept on review port (hard-reload) |

**Rules:**

- No production/`master` from agent whim  
- No new feature slices while a Gate 3 batch is open unless Stephen accepts or files a **bounded** finding  
- COA does not implement UI slices that belong to web-dev  

### 4.3 Deploy unit (repeatable)

1. Checkout ref (tag or SHA)  
2. `npm ci` if lockfile changed  
3. `npm run build` (prod-like)  
4. Atomic process replace  
5. Health check (`/api/health` version/SHA)  
6. Optional footer/build id for humans  

### 4.4 Local Gate 3 board (this host snapshot 2026-08-19)

- Branch: `beta` @ **193f079** — Layouts F4–F6 row select + Actions Edit  
- Process: `next dev --port 3200`  
- Health: ok · package version reported by health endpoint  
- Awaiting: Stephen Gate 3 on Layout Editor row UX + residual A–E  

---

## 5. Upgrades (product version → running tenant)

### 5.1 Locked policy (do not violate)

| ID | Rule |
|----|------|
| D1 | Tenant custom api names use **`c_`** namespace |
| D2 | System fields: **hide, do not delete** |
| D3 | Catalog/data **org-scoped** |
| D4 | v1 patches are **seed-only** (additive/updated system seeds; no destructive tenant row rewrite) |
| D5 | **Agent packages** only after **durable catalog** |
| D6 | **Branding** may proceed in parallel |

### 5.2 Code upgrade procedure (v1 realistic)

1. Announce target SHA/version  
2. Backup DB + env  
3. Deploy new system code artifact  
4. Run **migrations** (structural only)  
5. Run **system seed merge** (not full fixture reset)  
6. Health + smoke (login, one zone list/detail, Records Editor if enabled)  
7. Confirm tenant `c_*` types/fields and instance rows intact  
8. Only then: enable new system record types/fields in UI  

### 5.3 What v1 must **not** do

- `db:seed` that truncates tenant data in production  
- Delete system fields tenant hid  
- Install agent packages before durable catalog cutover  
- Silent `master` promote without Stephen  

### 5.4 Agent packages (D5 — landed 0.7.132)

Install/uninstall API is live: `c_`-prefixed seeds, hide-not-delete of system fields, Primary-Org-scoped overlay rows. Operator flow:

- Package verify → install seed merge → enable → smoke → rollback=disable
- Uninstall removes the package's overlay rows; hidden system fields reappear (hide-not-delete)
- Package format sketch: `state_upgradability.md` §6; expand here as packages are authored  

### 5.5 Branding upgrades (D6 parallel)

- Theme/logo/white-label assets may ship without catalog package framework  
- Still must not clobber tenant-uploaded brand assets on seed  

---

## 6. Catalog, data, and Records Editor ops

### 6.1 Today vs target

| Concern | Today (approx.) | Target |
|---------|-----------------|--------|
| Catalog durability | **Durable** — fixture `.data/catalog.json` / postgres `catalog_overlay` (0.7.105+), Primary-Org-scoped (0.7.132) | All zones honor saved layouts |
| Runtime layouts | Improving via I5.6.32; Gate 3 in flight | All zones honor saved layouts |
| Seeds | `scripts/seed.mjs` + fixtures; seed∪overlay merge on boot with `seed_pack` stamp | Versioned system seed packs |

### 6.2 Operator rules for Records Editor

- Treat Gate 3 review as **product truth** over stale docs  
- After layout changes: hard-reload; verify **runtime** form/list, not only editor canvas  
- Do not hand-edit production catalog JSON without a backup  

### 6.3 Durable catalog operations (landed 0.7.105–0.7.132 — no future cutover runbook required)

The planned big-bang cutover was superseded by incremental delivery:

- **Storage:** fixture mode → `.data/catalog.json`; postgres → `catalog_overlay` table. Legacy `site`-keyed overlay rows migrate to the Primary Org on boot (0.7.132).
- **Merge:** system seed ∪ overlay on boot; system fields hide-not-delete; new custom fields enforce the `c_` prefix (0.7.106).
- **Version stamp:** `overlay.seed_pack` records which seed-pack generation the overlay merged against (0.7.106).
- **Agent packages:** install/uninstall API writes `c_` seeds and overlay rows scoped to the Primary Org (0.7.132).
- **Operator rules:** back up `.data/catalog.json` / `catalog_overlay` before any seed work; never re-seed wipe `c_*`; verify Primary-Org scope after a migration boot.
- **Sample data:** Settings → Modes → Insert/Delete Sample Data (0.7.133); rows tagged `ba_sample:`; Demo mode writes none; the Primary Org is never deleted.  

---

## 7. Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| UI unchanged after git pull | Stale `.next` / old `next start` | Rebuild + restart; hard-reload (§3.4) |
| Blank login (Chrome only) | Cached HTML shell | Hard-reload; confirm Cache-Control |
| Health DB disconnected | Postgres down / bad DATABASE_URL | `npm run db:status` / fix env |
| Gate 3 “no effect” layouts | Runtime not consuming saved layouts | Check I5.6.32 track; do not “fix” with random seed reset |
| Permission denied on shared host files | Wrong group/mode for `agi_agents` | chgrp agi_agents; 640 files / 2750 dirs as appropriate |
| Port already in use | Orphan next dev | Identify PID; stop intended instance only |
| Module factory / lucide crash | Dead import after icon swap | Remove unused import; Gate 1/2; restart board |

---

## 8. Open gaps & document debt

| Gap | Impact | Tracker |
|-----|--------|---------|
| Durable catalog overlay | Landed 0.7.105–0.7.133 (D3 Primary-Org scope, D5 package API, Insert/Delete Sample Data). #239 closed 2026-09-06; #256/#269 done | Closed |
| VBA install skill | Authored and linked — skill id `business_admin`, `.agent/skills/business_admin.md`. Agents load it to install/operate/implement API. Product name Versa - Business Admin. | #240 |
| Production packaging (container/systemd unit) | Customer install thin — real remaining gap | *TBD* |
| Automated post-deploy smoke script | Manual curls today | *TBD* |
| `migrate_agi_org` | Dry-run/apply orgs 0.7.145; products/treasury and host-org disable still deferred | #278 / `state_migrate_agi_org.md` |
| README version pins lag HEAD | Prefer `git` + health version | refresh on release |

---

## 9. Quick reference commands

```bash
# Identity
git rev-parse --short HEAD
curl -s localhost:3200/api/health

# Quality gate
npx tsc --noEmit
npm run build

# DB
npm run db:health
npm run db:migrate
npm run db:seed

# Review board (example)
npx next dev --port 3200
```

---

## 10. Change log

| Date | Change |
|------|--------|
| 2026-08-18 | Task #240 opened — Stephen required setup/maintenance/upgrades/ops manual |
| 2026-08-19 | Initial filled outline: setup, maintenance, gates, seed-only upgrade posture, host port map, troubleshooting; aligned to locked D1–D6 |
| 2026-09-03 | Outline merged onto this working tree for Stephen's review. Horizon 3 now also includes a Mission Control skill (not authored yet). No TBD runbooks invented. |
| 2026-09-05 | Stephen authorized remaining overlay (D3/D5), Insert/Delete Sample Data, and authoring the Mission Control skill. Durable-catalog sequencing gate is closed. |
| 2026-09-06 | Expanded TBD sections to shipped reality: §2.7 prod-mode note, §3.5 restart recipe, §3.7 backups, §5.4 D5 landed, §6.1 today column, §6.3 durable-catalog ops runbook; §8 gaps updated. `business_admin` skill drafted. |
| 2026-09-07 | §2.0 agent install via skill `business_admin` (setup-enable Project + public GitHub URL + four instructions). §2.2 HTTPS clone. §2.9 HTTP API catalog (0.7.141, Settings → API). Skill marked ready. |
| 2026-09-07 | 0.7.142: product name **Versa - Business Admin** (VBA); §1.5 Admin vs member; no pre-launch aliases; install accounts = Administrator + COA; extra users = sample data. README links this manual + skill. |
| 2026-09-07 | 0.7.143: product name **Versa - Business Admin** (VBA). Skill id `business_admin` (not `mission_control`, to avoid agitop / Versa AGi - Mission Control). Manual/shape/hub files renamed off mission-control. Sample tag `ba_sample:`. |
| 2026-09-07 | 0.7.144: shipped project directory is **`Versa-BusinessAdmin`**. Clone into that folder name. GitHub repo remains `versa-agi-mission`. |
| 2026-09-07 | Official public production repo is **`versa-business-admin`**. Skill `business_admin` is COA-only; Orient (already installed?) first. One PU per system. |
| 2026-09-07 | This host's instance is **development** (build / test / deploy). Production will be remote. Leftover overlay `brand_name` and changelog "Admin System"/"VAS" strings set to **Versa - Business Admin**. |
| 2026-09-07 | 0.7.145: Demo-mode login alert + install-account hint box (passwords may have been changed). `scripts/migrate_agi_org.mjs` dry-run/apply. |

---

*End of manual (living). Prefer amending this file over creating parallel ops guides.*
