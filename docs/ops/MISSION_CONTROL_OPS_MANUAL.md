# Mission Control Operations Manual

**Product:** Versa AGi Mission (business Mission Control)  
**Repo / project:** `versa-admin-system` · Project **#26**  
**Audience:** Agents and humans implementing, hosting, maintaining, and upgrading Mission Control  
**Status:** **Outline on this working tree for review** (merged 2026-09-03 from `agent/coa` `6268c1c`). Expand sections marked *TBD* as durable catalog and production packaging land. Host snapshot in §4.4 is from 2026-08-19 and may lag HEAD.  
**Governing design:** `docs/production/state/state_upgradability.md` (D1–D6 **locked**)  
**Map:** `docs/production/state/shape_mission_control.md`  
**Roadmap:** `docs/coa/MISSION_CONTROL_PRODUCTION_PLAN.md` — Horizon 3  
**Task:** #240  
**Also planned (Horizon 3):** agent-facing **Mission Control skill** — not authored yet; see §8.  

> **Do not invent upgrade runbooks that contradict seed-only v1 (D4) or other locked D1–D6 decisions.**

---

## 0. How to use this manual

| You need to… | Go to |
|--------------|--------|
| Understand what this product is / is not | §1 |
| Install or boot a dev/review instance | §2 |
| Day-2 care (logs, health, stale UI) | §3 |
| Ship a code change safely (gates, branches, ports) | §4 |
| Apply a product version upgrade (tenant-safe) | §5 |
| Operate data/catalog/backups | §6 |
| Troubleshoot common failures | §7 |
| Know open gaps / what not to do yet | §8 |

Related living docs (do not duplicate ERD/UX here):

| Doc | Role |
|-----|------|
| `README.md` | Product map, quick start, docs index |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Boundaries vs agitop |
| `docs/production/state/shape_mission_control.md` | Feature map — open first |
| `docs/production/state/state_i5_6_zone_erd.md` | Zone ERD |
| `docs/production/state/state_api_contract.md` | HTTP API |
| `docs/production/state/state_layout_mission_ui.md` | Shell / IA |
| `docs/production/state/state_records_editor_ux.md` | Records Editor / layouts |
| `docs/production/state/state_db_cutover_checklist.md` | DB cutover |
| `docs/production/state/state_upgradability.md` | Upgrade model D1–D6 |
| `docs/coa/MISSION_CONTROL_PRODUCTION_PLAN.md` | Horizons / roadmap (skill is Horizon 3 #4) |
| `docs/ops/STALE_UI_AND_DEPLOY.md` | Stale `.next` / cache incidents |
| `docs/GIT_WORKFLOW.md` | Branch model |

---

## 1. Product identity (operators)

### 1.1 What it is

Standalone **business Mission Control** for a Versa AGi-powered business: public presence, people, work, organization, collaboration parties, environmental context.

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

---

## 2. Setup

### 2.1 Prerequisites

- Node.js compatible with the repo lockfile (use version CI/local team standard; do not freestyle major bumps without Stephen)
- npm
- Git + SSH access to `git@github.com:swartzlib7/versa-agi-mission.git`
- Optional Postgres when leaving pure fixtures (`scripts/vagrant-postgres.sh`, `npm run db:*`)
- Host OS note (this installation): Ubuntu 24.04 native_linux

### 2.2 Clone and install

```bash
git clone git@github.com:swartzlib7/versa-agi-mission.git
cd versa-agi-mission   # workspace name may be versa-admin-system
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
- [ ] Hard-refresh browser once after first load  

### 2.7 Multi-instance / port map (this host — living)

| Port | Role (current practice) |
|------|-------------------------|
| **3200** | Primary Stephen Gate 3 / beta review (`next dev`) |
| **3100** | Historically production-like review board (`next start`) — may be down |
| **3210** | Scratch / worktree experiments — do not treat as Gate 3 |

Update this table when ports change; do not assume README alone is current.

### 2.8 Customer / greenfield install (*TBD expand*)

Outline only until packaging exists:

1. Provision host + Node + reverse proxy (HTTPS)  
2. Deploy immutable artifact (image or SHA-named build dir)  
3. Configure env + empty durable store  
4. Run migrations + **system seed** (not tenant data clone)  
5. Create first admin human user  
6. Health + smoke  
7. Optional: turn off agitop Organization if using MC Organization model (product boundary)

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
# 1) stop existing next dev on 3200
# 2) cd repo && git checkout beta && git pull --ff-only
# 3) rm -rf .next   # when switching SHAs or after bad build
# 4) npx next dev --port 3200
# 5) curl health + /login
```

### 3.6 Credentials & host permissions (AGi co-hosting)

When Mission Control shares a Versa AGi host with agents:

- Workspace dirs that agents must read: group `agi_agents`, avoid `coa:coa` 660 on shared secrets  
- Never world-readable credentials  
- Script Tasks run as `assigned_to` OS user — state files need group-writable dirs  

(Operational lesson 2026-08-18: email-access + PH state paths.)

### 3.7 Backups (*TBD deepen with durable catalog*)

| Asset | v1 guidance |
|-------|-------------|
| Git | Remote is source of truth for code |
| `.env.local` | Host backup only; encrypted |
| Postgres | Scheduled dump when DB is source of truth |
| Tenant catalog overlays | Backup with DB; restore must not re-seed wipe `c_*` |
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

### 5.4 Future: agent packages (*blocked on D5 prerequisite*)

See sketch in `state_upgradability.md` §6. Manual section reserved:

- Package verify → install seed merge → enable → smoke → rollback=disable  

### 5.5 Branding upgrades (D6 parallel)

- Theme/logo/white-label assets may ship without catalog package framework  
- Still must not clobber tenant-uploaded brand assets on seed  

---

## 6. Catalog, data, and Records Editor ops

### 6.1 Today vs target

| Concern | Today (approx.) | Target |
|---------|-----------------|--------|
| Catalog durability | Partial / session gaps on layouts | Durable org-scoped store |
| Runtime layouts | Improving via I5.6.32; Gate 3 in flight | All zones honor saved layouts |
| Seeds | `scripts/seed.mjs` + fixtures | Versioned system seed packs |

### 6.2 Operator rules for Records Editor

- Treat Gate 3 review as **product truth** over stale docs  
- After layout changes: hard-reload; verify **runtime** form/list, not only editor canvas  
- Do not hand-edit production catalog JSON without a backup  

### 6.3 Durable catalog cutover (*TBD runbook when planned*)

Placeholder steps (align with Task 239 sequencing):

1. Schema for catalog tables  
2. Import fixture baseline as system seed  
3. Dual-read period  
4. Cutover flag  
5. Disable session Map authority  

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
| Durable catalog not fully landed | Blocks overlay impl + agent packages | #239 — Gate 3 I5.6.33 accepted; still wait on durable-catalog sequencing |
| Mission Control skill not authored | Other agents / new COAs have no loadable procedure for style, API, install, operate-for-other-PUs | Horizon 3 / #240 — add after Stephen reviews this outline |
| Production packaging (container/systemd unit) | Customer install thin | *TBD* |
| Automated post-deploy smoke script | Manual curls today | *TBD* |
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

---

*End of manual (living). Prefer amending this file over creating parallel ops guides.*
