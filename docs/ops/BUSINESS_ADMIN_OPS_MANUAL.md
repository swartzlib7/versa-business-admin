# Versa - Business Admin — Operations Manual

**Product:** Versa - Business Admin (VBA)  
**Directory:** `Versa-BusinessAdmin`  
**Audience:** Agents and humans **implementing, hosting, maintaining, customizing, and enhancing** VBA on a customer install. Staff who use the product read [`BUSINESS_ADMIN_USER_MANUAL.md`](BUSINESS_ADMIN_USER_MANUAL.md) (§7 Page Builder; rest planned).  
**Agent skill:** `business_admin` — host file `.agent/skills/business_admin.md` (Versa AGi, COA-only). What it covers is summarized in §2.0.

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
| Ship a local enhancement safely | §4 |
| Apply a product version upgrade (tenant-safe) | §5 |
| Operate data/catalog/backups | §6 |
| Troubleshoot common failures | §7 |
| Know open gaps / what not to do yet | §8 |

Related product docs:

| Doc | Role |
|-----|------|
| `README.md` | Product name, roles, Ops Manual + skill usage |
| `docs/ops/BUSINESS_ADMIN_USER_MANUAL.md` | Staff User Manual — Page Builder §7 written; rest planned |
| `docs/ops/WORKING_WITH_VBA.md` | Forms, listings, Spatial Twin, stale UI / deploy |
| `GET /api` and Settings → API | HTTP API catalog for this version |
| Versa AGi skill `business_admin` | Agent install / orient (host file, not this repo) |

---

## 1. Product identity (operators)

### 1.1 What it is

Standalone **Versa - Business Admin** for a Versa AGi-powered business: public presence, people, work, organization, collaboration parties, environmental context.

Review `localhost:<port>` (often **3200**) is not production. Production is whatever host the Primary User names.

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

Full rules: §5.

### 1.5 Admin vs member (same login)

There is **one** login page. Admin and member are not different apps or different URLs.

| | Administrator | Member |
|--|---------------|--------|
| Stored as | `users.role = admin` | `users.role = member` |
| Code | `isAdmin(session)` in `src/lib/auth.ts` | Authenticated, not admin |
| Writes | Catalog, settings, sample data, users, orgs, projects, tasks, records | Self profile (not role/type/status); assignee can update task status |
| Install accounts | One human (`admin@example.com`) and one agent COA (`coa@example.com`) | Extra people come from **Insert Sample Data** only |

API catalog `auth` column: `open` / `session` / `admin` / `admin-or-self` / `admin-or-assignee`. The HTTP API does not dual-publish old names unless the Primary User asks. Overlay-read folds (`name-aliases.ts`) map pre-1.0 catalog names on load.

**First login (Demo mode):** The system ships in demo mode. Turn it off in Settings → Modes before real use. Turning it off deletes the sample pack. `/login` shows an alert to change the Administrator (human) and COA (agent) passwords. The install email/password hint box appears **only while Demo mode is on**, and says passwords may have been changed. After sign-in the same reminder sits in the operator shell until Demo mode is turned off. Change passwords on **Users**.

Also in root `README.md` (Roles).

---

## 2. Setup

### 2.0 Agent install (skill `business_admin`)

COA loads the Versa AGi skill **`business_admin`** (`.agent/skills/business_admin.md`, **COA-only**). This manual is what that skill points at. The skill’s first step is **whether VBA is already installed on this host**; only then clone/install or continue.

**Versa AGi setup:** when `[features] business_admin` is ON, setup seeds the reserved Project **`Versa-BusinessAdmin`**. That Project’s description carries the public GitHub URL and these four instructions:

1. Clone the public repo `https://github.com/swartzlib7/versa-business-admin.git` (branch `main`) into the reserved directory **`Versa-BusinessAdmin`**. Do not clone a second copy if that workspace already exists.
2. Read this ops manual.
3. Run the installation in §2.2–§2.6.
4. Implement against the HTTP API (`GET /api`, Settings → API).

COA does **not** `agictl project add` a second name. If `agictl project list` has no project named `Versa-BusinessAdmin`, stop and tell the Primary User (the feature may be off). Ask the Primary User before install or configure. Do not deploy until they agree.

**What the skill covers** (do not duplicate the full procedure here):

| Topic | In the skill |
|-------|----------------|
| Orient | Installed already? Project **name** `Versa-BusinessAdmin`, workspace directory, health — then install or continue |
| Enablement | Setup seeds the reserved Project. COA does not register a duplicate |
| Clone + boot | Public HTTPS or SSH, `main`, `npm ci`, `.env.local`, build, start, health — after PU agrees |
| API | `GET /api` catalog, Settings → API, conventions, `c_` / `ba_sample:` |
| D1–D6 | Seed-only upgrades, overlay, hide-not-delete, agent packages |
| Day-2 | Exact-PID restart, backups, stale UI; first-host install §2.8 |

When the Primary User asks COA to install or implement Versa - Business Admin, COA loads `business_admin` and executes it.

### 2.1 Prerequisites

- Node.js compatible with the repo lockfile (do not freestyle major bumps without the Primary User)
- npm
- Git + access to the public repo `https://github.com/swartzlib7/versa-business-admin` (SSH `git@github.com:swartzlib7/versa-business-admin.git` also fine)
- Optional Postgres when leaving pure fixtures (`scripts/vagrant-postgres.sh`, `npm run db:*`)
- Host OS: Ubuntu 24.04 recommended (same as Versa AGi)

### 2.2 Clone and install

```bash
git clone https://github.com/swartzlib7/versa-business-admin.git Versa-BusinessAdmin
# or: git clone git@github.com:swartzlib7/versa-business-admin.git Versa-BusinessAdmin
cd Versa-BusinessAdmin
git checkout main      # stable line; use `beta` only for integration review
npm ci                 # prefer ci when lockfile present
cp .env.example .env.local   # then edit secrets — never commit .env.local
```

### 2.3 Environment

Use `.env.example` as the contract. Copy to **`.env.local`** (gitignored). Typical keys:

- `DATA_SOURCE=postgres` (shipped default) and `DATABASE_URL`
- Auth/session secrets  
- Any public URL / allowed dev origins for LAN testing  

**Rule:** secrets stay host-local; agents must not paste secrets into chat. `.env.local` is the connection config — there is no separate “data connection file.”

### 2.4 PostgreSQL (required to ship)

VBA **ships on Postgres**. Fixture mode (`DATA_SOURCE=fixture`) is an explicit opt-in for tests without a database. It is not production and it does not survive process restart.

Connection is **`.env.local`**:

```
DATA_SOURCE=postgres
DATABASE_URL=postgresql://USER:PASSWORD@127.0.0.1:5432/business_admin
```

Never commit `.env.local`. The same keys work on this box and on **AWS Lightsail** (change host/user/password). The app does **not** embed a Postgres server; it talks to whatever `DATABASE_URL` points at. Production today is Lightsail (app + Postgres on that instance). Firebase Hosting / `versa-agi.web.app` is retired.

**Local PostgreSQL 16:**

```bash
# once, as a user who can sudo (creates role versa_ba + database business_admin, writes .env.local)
sudo bash scripts/provision-local-postgres.sh

cd Versa-BusinessAdmin
npm run db:migrate    # drizzle migrations
npm run db:seed       # Primary Org + Administrator + COA + catalog (idempotent)
npm run db:status     # pg_isready
curl -s localhost:<port>/api/health   # status=ok and database.connected=true
```

**Remote app + Postgres on the same instance:** same keys; change host/user/password. Do not point a local review port at the production database unless the Primary User asks.

**A new Versa AGi host (Lightsail or elsewhere):**

1. Install PostgreSQL 16 on the box (`postgresql` + `postgresql-client`), or point `DATABASE_URL` at a managed instance in the **same region** as the app.
2. Create a role + database (or run `scripts/provision-local-postgres.sh` if this is a local-socket install).
3. Put `DATA_SOURCE=postgres` and `DATABASE_URL` in `.env.local`.
4. `npm run db:migrate && npm run db:seed`
5. Boot VBA (`npm run build && next start`). Health must show `database.connected=true`. The first boot installs the site pack (Versa AGi Primary slides, the seven Versa page canvases, styles, menus): log line `Site pack installed: N records.`
6. Then `migrate_agi_org --apply` so Org data is durable.

An install that already has a site upgrades by §5.2.1. Do not follow this new-host list for that case.

**Changing the shipped site:** edit it on the development instance, run `npm run site:export`, and commit `src/lib/site-pack/site-pack.json`. Installs that already have a site keep theirs.

Do **not** use `scripts/vagrant-postgres.sh` for shipping — that was a Phase-1 knowledgebase VM helper.

Seed never truncates tenant data. Re-running `db:seed` does not wipe a migrated org.

### 2.5 Run modes

| Mode | Command | Use |
|------|---------|-----|
| Dev (HMR) | `npx next dev --port <port>` or `npm run dev` | Active UI work; listen port often **3200** |
| Production-like | `npm run build && npx next start -p <port>` | Stale-UI-sensitive; must rebuild+restart every deploy |
| Lint / types | `npm run lint`, `npx tsc --noEmit` | Gate 1 evidence |

### 2.6 First-boot verification checklist

- [ ] `git rev-parse --short HEAD` is the intended SHA  
- [ ] `npm run build` succeeds (for prod-like) **or** dev server clean start  
- [ ] `GET /login` → 200  
- [ ] `GET /api/health` → JSON `status=ok`, `version` matching `package.json`, `database.connected=true`  
- [ ] Sign-in works with known test user (from `db:seed`)  
- [ ] Change Administrator + COA passwords (Demo-mode alert on `/login` and in the backend shell)  
- [ ] Hard-refresh browser once after first load  

### 2.7 Listen port

The default review port in this product is **3200**. Use the port the Primary User names. Identify the process with `ss -tlnp`; never `pkill -f`.

### 2.8 Customer / greenfield install (*TBD expand*)

Outline only until packaging exists:

1. Provision host + Node + reverse proxy (HTTPS)  
2. Deploy immutable artifact (image or SHA-named build dir)  
3. Configure `.env.local` (`DATA_SOURCE=postgres`, `DATABASE_URL`) + empty durable store  
4. `npm run db:migrate` + `npm run db:seed` (**system seed**, not tenant data clone)  
5. Create the two install administrator accounts (human Administrator + agent COA)  
6. Health + smoke  
7. Do **not** disable agitop Organization unless the Primary User asks after a verified migrate.

### 2.9 HTTP API (this version)

The product HTTP API is complete for the 0.7.142 feature set.

| Surface | What it is |
|---------|------------|
| `GET /api` | Open JSON index: package version, `docs` links, full `resources[]` (`src/lib/api/inventory.ts`) |
| Settings → **API** | Operator view of the same catalog |
| `GET /api/health` | Process + DB health; `version` matches `package.json` |

Agents implementing integrations start at `GET /api`. Public System Landscape: `/api/public/system-landscape`. Agents are users: `GET /api/users?type=agent`. No HTTP compatibility aliases unless the Primary User asks. Admin vs member: §1.5.

### 2.10 Host Organization migrate (`migrate_agi_org`)

Script: `scripts/migrate_agi_org.mjs` (`npm run migrate:agi-org`).

- Default **dry-run** — reads host `agictl organization`, lists source orgs, and inspects the VBA target for existing production data.
- **`--primary-source-org-id`** (id, slug, `external_id`, or name) is **required to apply**. That source org is merged onto VBA’s existing Primary Org (`internal` + `is_primary`). Other own Wave businesses become additional **Orgs** (`org_type=internal`, not Primary, not Collaboration Branch). The script will not guess.
- `--apply --base http://localhost:3200` writes mapped orgs **and** catalog records (locations, contacts, staff, products, invoices/estimates + line items, **credential configuration**, Wave integration, exchange). Idempotent via `data.external_id` / `data.agi_org_id`. Fixture-mode rows are **in-memory** until restart.
- Credential `configuration` is copied onto `vendor_credential` (needed after host Organization is turned off). The migrate report never prints it. Storage is catalog long_text until a vault exists — admins can see it in Records Editor.
- If **both** systems already have production data, apply is not a blank-slate load. The script’s `post_process.check` tells the **agent team** whether a merge pass is required (match `external_id`, then reconcile VBA-only rows).
- `--disable-host-org` is **refused** unless the Primary User has asked. After a verified migrate, disable agitop Organization so both catalogs do not own the same parties — only when the PU asks.

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

From [`WORKING_WITH_VBA.md`](WORKING_WITH_VBA.md) §4:

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

### 3.5 Process lifecycle

```bash
# Example: restart on 3200 (adjust if the Primary User named another port)
# 1) identify PID: ss -tlnp | grep 3200  (kill that PID; never pkill -f — it self-matches)
# 2) git pull --ff-only   # or checkout the intended SHA
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

### 3.7 Backups

**`npm run backup`** (1.0.14) writes one folder per run under `backups/` (git-ignored): `db.dump` (`pg_dump -Fc`), `env.local`, `data/` (site-settings, catalog, sample-data JSON) and `uploads.tar.gz`, plus `manifest.json`. Needs `pg_dump` on the PATH. Restore the database with `pg_restore -d "$DATABASE_URL" --clean db.dump` and the uploads with `tar -xzf uploads.tar.gz -C <uploads folder>`.

| Option | Effect |
|--------|--------|
| `--out DIR` | Write somewhere else, e.g. an external drive |
| `--no-uploads` / `--uploads` | Skip or include the uploads folder for this run |
| `VBA_BACKUP_UPLOADS=false` in `.env.local` | Skip uploads by default (use when the uploads folder is a drive that is already backed up) |

**Uploads folder.** Image gallery pictures (`record-images/`) and Attachments (`record-files/`) are files on disk, **not** in Postgres, so a database dump alone misses them. The folder is `.data/` by default. Set `VBA_UPLOADS_DIR=/path` in `.env.local` to keep uploads elsewhere, for example a mounted drive or a synced Google Drive / OneDrive folder; restart after changing it and move the two subfolders across. `VBA_ATTACHMENT_MAX_MB` (default 20) sets the per-file limit for Attachments; the request-size limit follows it after the next build.

| Asset | v1 guidance |
|-------|-------------|
| Git | Remote is source of truth for code |
| `.env.local` | Host backup only; encrypted |
| `.data/data-key` (1.0.18) | The key that encrypts stored credentials (or `VBA_DATA_KEY`). **Not** in `npm run backup`, on purpose: a stolen backup must not carry the key to its own secrets. Keep one copy somewhere else (a password manager, an encrypted drive). Lose it and every Credential must be typed in again |
| Postgres (DATA_SOURCE=postgres) | Scheduled `pg_dump` — includes `catalog_overlay`, zone tables (`executive_project` with its task lines, `production_product`), and the whole public site: `site_settings` (Page Builder, menus, modes in `body`) plus Pages records and Elements |
| `.data/site-settings.json` | Until the first 1.0.4 boot has copied it into `site_settings.body`, this file **is** the live Page Builder, menus, and modes. Back it up and leave it in place (§5.2.1). After that copy it is a cache: boot rewrites it from Postgres. Do not edit it by hand |
| Durable catalog overlay (fixture mode) | `.data/catalog.json` IS the tenant customization store when no DB — back up the file |
| Uploads (`record-images/`, `record-files/`) | On disk in the uploads folder (`VBA_UPLOADS_DIR`, default `.data`). Included by `npm run backup` unless turned off |
| Overlay restore rule | Restore must not re-seed wipe `c_*`; seed∪overlay merge on boot makes system seed re-runnable, overlay must survive |
| Sample data | Rows tagged `ba_sample:`; insert/delete via Settings → Modes — never hand-delete the Primary Org |
| Fixture-only dev | Disposable; do not treat as production data |

---

## 4. Change delivery (customer-local enhancement)

Public GitHub is **`main`**. This checkout is pull-only. Do not commit product changes and do not `git push`. The Primary User publishes `main`. Do not invent a second published line. Do not promote or bump versions unless the Primary User asks.

### 4.1 Quality before claiming done

- `npx tsc --noEmit`
- Scoped eslint
- `npm run build` when the running `next start` process must show the change
- Restart per §3.5; verify `GET /api/health` in its own call

### 4.2 Deploy unit (repeatable)

1. Checkout ref (tag or SHA)  
2. `npm ci` if lockfile changed  
3. `npm run build` (prod-like)  
4. Atomic process replace  
5. Health check (`/api/health` version)  
6. Browser hard-reload (§3.4)

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

**Every upgrade runs `npm run db:migrate`**, even when the version notes below say "No new migration". It only applies migrations the database does not have yet, so on a current database it changes nothing. Run it before the new process serves traffic.

**Skipping versions:** go straight to the newest version in **one** upgrade (back up, pull, `npm ci`, `npm run db:migrate`, build, restart). Do not deploy the versions in between one by one. The one `npm run db:migrate` applies every missing migration (1.0.9 brings `0020`), and the first start rebases the catalog onto the newest seed pack, so all new fields and types arrive together. Then read the §5.2.x section of every skipped version, oldest first, for its notes on existing data. Check the installed version first: `curl -sS localhost:<port>/api/health`.

### 5.2.1 Existing install to 1.0.4

Use this when the server already runs Business Admin and staff have customized it. The development database is the stock Versa AGi site. Do not restore it onto a customized install.

On the server, from its checkout. `<port>` is the port it already uses. Restart detail is §3.5.

```bash
pg_dump "$DATABASE_URL" -Fc -f ~/vba-before-1.0.4.dump
cp .env.local ~/env.local.bak
cp .data/site-settings.json ~/site-settings.bak

git pull --ff-only
npm ci
npm run db:migrate          # adds site_settings.body
npm run build

ss -tlnp | grep <port>      # kill that exact PID; never pkill -f
nohup ./node_modules/.bin/next start -p <port> > __tmp/next.log 2>&1 &

curl -s localhost:<port>/api/health    # "version":"1.0.4", then hard-reload the browser
```

Leave `.data/site-settings.json` in place until that first start finishes. The first start copies it into Postgres. Users, records, Page Builder, menus, and branding stay. The code arrives: tabs, Fit content rows on phones, footer link columns, sign-up, and full HTML canvases.

If `.data/site-settings.json` is missing on that first start, boot treats the install as new and installs the stock site pack over Page Builder, menus, and branding. A database restore from the development machine replaces users and records as well.

The stock Versa AGi slides, Analysis page, and phone styles install only on a new host (§2.8). A customized install does not receive them.

### 5.2.2 Existing install to 1.0.5

Same steps as §5.2.1. `npm run db:migrate` adds `auth_token`. Health reports `"version":"1.0.5"`. Leave `.data/site-settings.json` in place. Catalog seed pack stays `1.0.4-r2`.

### 5.2.3 Existing install to 1.0.6

Same steps as §5.2.1. No new migration. Catalog seed pack becomes `1.0.6-r3`. The first start replaces free-text Status fields with picklists and adds Phone and Email on Location. The footer then reads the primary Location. Health reports `"version":"1.0.6"`. Leave `.data/site-settings.json` in place.

### 5.2.4 Existing install to 1.0.7

Same steps as §5.2.1. No new migration. Catalog seed pack stays `1.0.6-r3`. Health reports `"version":"1.0.7"`. Leave `.data/site-settings.json` in place.

### 5.2.5 Existing install to 1.0.8

Same steps as §5.2.1. No new migration. Catalog seed pack stays `1.0.6-r3`. Health reports `"version":"1.0.8"`. Leave `.data/site-settings.json` in place.

### 5.2.6 Existing install to 1.0.9 (Project task lines)

Same steps as §5.2.1, and run `npm run db:migrate` before the new process serves traffic. Migration `0020` copies Project milestones, Task records, their subtasks, and leftover rows in the old `tasks` table onto Project task lines, then removes the Task records, the Task record type, and that table. A migrated Task keeps its id as the line id. An old `projects` row that a leftover task points at is copied as a Project record with the same id. A Task with no Project lands on a Project named `Unassigned tasks`. The migration stops and rolls back if the new line count differs from the rows it moved. Catalog seed pack becomes `1.0.9-r1`. Health reports `"version":"1.0.9"`.

### 5.2.7 Existing install to 1.0.10 (Hats)

Same steps as §5.2.1. No new migration. Catalog seed pack becomes `1.0.10-r1`. The first start adds the Hats record type (`executive_hat`) under Executive and the Text list and Multi-lookup field types. Existing records and image galleries are unchanged; image descriptions start empty. Health reports `"version":"1.0.10"`. Leave `.data/site-settings.json` in place.

### 5.2.8 Existing install to 1.0.11

Same steps as §5.2.1. No new migration. Catalog seed pack stays `1.0.10-r1`. Health reports `"version":"1.0.11"`. Leave `.data/site-settings.json` in place. After the restart, Custom Records → Statistics shows the Spatial Twin again.

### 5.2.9 Existing install to 1.0.12 (Statistics target)

Same steps as §5.2.1, including `npm run db:migrate`. 1.0.12 adds no migration of its own; the step applies any earlier one the install is missing (an install below 1.0.9 gets `0020`, see §5.2.6). Catalog seed pack becomes `1.0.12-r1`. The first start adds two Statistics header fields, Period target (`period_target`) and Target per step (`slot_target`, read-only). A Statistics layout saved before 1.0.12 gets both at the end of its Frequency section. Existing statistics have no target until one is entered, and their graphs look as before apart from the date format. Captured values are unchanged. Statistic value rows are now edited in place (Table or Enhanced UI) and can no longer be deleted from the UI; `DELETE /api/statistics/<id>/lines` still works for scripts. Health reports `"version":"1.0.12"`. Leave `.data/site-settings.json` in place.

### 5.2.10 Existing install to 1.0.13 (Statistics rows)

Same steps as §5.2.1, including `npm run db:migrate`. 1.0.13 adds no migration and no catalog change; seed pack stays `1.0.12-r1`. Health reports `"version":"1.0.13"`. Leave `.data/site-settings.json` in place. Statistic rows typed into a second period by mistake under 1.0.12 are still there after the upgrade: staff remove them with the row trash icon in Custom Records → Statistics → open the statistic → Table.

### 5.2.11 Existing install to 1.0.14 (Attachments, Summary fields, Vehicle Mileage Log)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Before stopping the old process, back up with `npm run backup` (§3.7). Catalog seed pack becomes `1.0.14-r1`. The first start adds:

- **Treasury → Records, Assets and Materiel:** Asset category, VIN / Serial number, Purchase date, Purchase price, Business use %, Current odometer, Next service due, and Documents & Photos (Attachments). Existing assets keep their values; the new fields start empty.
- **Treasury → Vehicle Mileage Logs** (new tab): header Vehicle, Tax year, Starting odometer and the totals Total miles, Business miles, Business use %; one line per trip (Date, Odometers, Miles, Business use, Business, Purpose).
- **Statistics:** a Source section (fed from records). Statistics layouts saved before 1.0.14 get it at the end.
- **Value sets:** `asset_category`; `file_mime` gains Word, Excel and HEIC / HEIF.

Optional `.env.local` settings: `VBA_UPLOADS_DIR`, `VBA_ATTACHMENT_MAX_MB`, `VBA_BACKUP_UPLOADS` (§3.7). Run `npm run build` after changing `VBA_ATTACHMENT_MAX_MB`. Health reports `"version":"1.0.14"`. Leave `.data/site-settings.json` in place.

### 5.2.12 Existing install to 1.0.15 (Job costing, Formula fields, Clone / Convert)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Back up first with `npm run backup` (§3.7). Catalog seed pack becomes `1.0.15-r1`. The first start adds:

- **Treasury → Transactions:** Project; Cost total, Margin, Margin %; Allocated / Remaining (bills); lines Vendor, Unit cost, Markup %, Line cost, Vendor bill, Actual cost, Variance. **Subtotal** becomes a Summary of the lines; Amount, Unit price and Line total get calculated defaults. Document kind gains **Bill**.
- **Executive → Projects:** Customer.
- **Statistics:** Read from (Lines / Records) in the Source section.

What changes for existing data:

- Transactions **with an External ID** (imported from Wave) are not recalculated; their stored amounts stay as imported.
- Transactions created in VBA are recalculated the next time they are saved: Subtotal becomes the sum of the line totals. A typed Amount, Unit price or Line total that differs from the calculation is kept.

Health reports `"version":"1.0.15"`. Leave `.data/site-settings.json` in place.

### 5.2.13 Existing install to 1.0.16 (Demo tour, new Page Builder drivers)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Back up first with `npm run backup` (§3.7). Catalog seed pack becomes `1.0.16-r1`. The first start adds the Rendering Driver records **Transaction**, **Asset** and **Organization board**, and moves **Vehicle Mileage Logs** from Treasury to **Custom Records** (existing logs move with the type; the API type name `treasury_vehicle_mileage_log` does not change). As with every seed-pack change, system record types and fields take the release's settings again.

Build with Demo on is safe: start-up writes (sample pack, driver records, site pack, catalog stamp) now wait for the first real start instead of running in every `next build` worker.

With **Demo on**, the first start:

- adds the new sample records (vendor, product, promotion, review, estimate → invoice → vendor bill, van with three documents saved in the uploads folder, mileage log, Business miles statistic);
- replaces the Demo canvas with the guided tour and removes the six sample Elements the old Demo canvas used (Facets, Integrations, Inspections & Reports page, About, the Integration and Support Requests tables). Staff canvases and Primary are not touched;
- keeps sample records that already exist as they are. The existing "Sample monthly visits" statistic keeps its old dates and values, so it shows no target or pace. For the full tour, turn Demo off and on again in Settings → Modes (this deletes and re-adds the sample pack only).

With **Demo off**, no sample data is added.

**Versa AGi site pages:** the first start replaces the site-pack pages that changed (Technical Overview, Capabilities, Deployment, Versa AGi styles) where they are still as an earlier release shipped them. A page edited on this install is kept; the log says `Site pack: <page> edited on this install; left as is.` To take the new version anyway, copy its body from `src/lib/site-pack/site-pack.json` into the page (Custom Records → Pages).

Health reports `"version":"1.0.16"`. Leave `.data/site-settings.json` in place.

### 5.2.14 Existing install to 1.0.17 (security fix: signed sessions)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Catalog seed pack stays `1.0.16-r1`. **Do this on every install; public ones (reachable from the internet) first.**

- Up to 1.0.16, anyone could forge an administrator session. 1.0.17 signs sessions and refuses unsigned, altered or expired ones.
- After the restart **every user signs in again** (old sessions are refused). Agents that call the API sign in again the same way (proof-of-work challenge, then the session cookie).
- The first start creates `.data/session-secret` (mode 600). Leave `.data/` in place on upgrades and backups. To set the secret yourself (for example on two processes behind one address), put the same `VBA_SESSION_SECRET` in each `.env.local`; changing it signs everyone out.
- `src/middleware.ts` is replaced by `src/proxy.ts`. A pull that still has a local `src/middleware.ts` (for example an edited copy) must remove it, so only `src/proxy.ts` is used.
- Check after the restart: signing in works, and `curl -s -o /dev/null -w "%{http_code}" -H "Cookie: __session=eyJyb2xlIjoiYWRtaW4ifQ==" localhost:<port>/api/users` prints `401`.

Health reports `"version":"1.0.17"`.

### 5.2.15 Existing install to 1.0.18 (security fix: stored credentials)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Catalog seed pack stays `1.0.16-r1`. **Do this on every install.** Back up first (`npm run backup`).

- Up to 1.0.17 a Credential's Configuration (for example the mailbox password) was stored in plain text and every signed-in user, member included, could read it through `GET /api/records`. 1.0.18 encrypts secret fields at rest (AES-256-GCM) and never returns them through the API.
- The first start encrypts the stored Credentials; the log says `Encrypted the secret fields of N record(s) stored before 1.0.18.` once.
- The first start creates `.data/data-key` (mode 600). **Copy it somewhere safe, apart from the backups** (§3.7). For an install reachable from the internet, prefer `VBA_DATA_KEY` (64 hexadecimal characters, `openssl rand -hex 32`) in the environment, so the key is not in `.data` at all. Set it **before** the first 1.0.18 start, or the file key is used; switching keys later means typing every Credential in again.
- A wrong or missing key does not stop VBA: Credentials show `••••••`, system mail stops, and the log says the value could not be decrypted. Put the right key back and restart.
- Check after the restart: Settings → E-Mail Delivery still sends (for example Forgot password to yourself), and `GET /api/records?type=vendor_credential` shows `••••••` where the password was.

Health reports `"version":"1.0.18"`.

### 5.2.16 Existing install to 1.0.19 (the Versa pages in the default site)

Same steps as §5.2.1, including `npm run db:migrate` (no new migration). Catalog seed pack stays `1.0.16-r1`. Back up first (`npm run backup`).

- The first start brings the site up to this release's site pack, on its own. The server log says what it did, for example:
  - `Site pack: updated Versa AGi — Analysis, …` — pages still exactly as an earlier release shipped them took the new version.
  - `Site pack: … edited on this install; left as is.` — a page someone changed is kept. To take the new version, compare it with the pack page on a fresh install and copy across by hand.
  - `Site pack: added page:versa-agi-story, …, canvas:cv-story, …` — the six new pages and canvases.
  - `Site pack: updated canvas Analysis (menu_enabled, seo)` — canvas settings still as an earlier release shipped them took the new values; a setting changed on this install is kept.
  - `Site pack: not added …` — a canvas whose address (`/p/<slug>`) is already used here, or no room (12 canvases). Free the address or delete a canvas, then add it in Page Builder by hand.
- New pages and canvases are added **once**. The install remembers them (`site_pack_added` in the site settings), so one deleted afterwards stays deleted.
- Check after the restart: `/p/story` opens and its links reach the other six pages; the visitor menu shows The Versa story and The founder; the theme button switches the story page between light and dark.

Health reports `"version":"1.0.19"`.

### 5.3 What v1 must **not** do

- `db:seed` that truncates tenant data in production  
- Delete system fields tenant hid  
- Install agent packages before durable catalog cutover  
- Silent `main` promote without the Primary User  


### 5.4 Agent packages (D5 — landed 0.7.132)

Install/uninstall API is live: `c_`-prefixed seeds, hide-not-delete of system fields, Primary-Org-scoped overlay rows. Operator flow:

- Package verify → install seed merge → enable → smoke → rollback=disable
- Uninstall removes the package's overlay rows; hidden system fields reappear (hide-not-delete)
- Expand this section as packages are authored  


### 5.5 Branding upgrades (D6 parallel)

- Theme/logo/white-label assets may ship without catalog package framework  
- Still must not clobber tenant-uploaded brand assets on seed  

---

## 6. Catalog, data, and Records Editor ops

### 6.1 Today vs target

| Concern | Today (approx.) | Target |
|---------|-----------------|--------|
| Catalog durability | **Durable** — fixture `.data/catalog.json` / postgres `catalog_overlay` (0.7.105+), Primary-Org-scoped (0.7.132) | All zones honor saved layouts |
| Runtime layouts | Saved layouts on Records Editor | All zones honor saved layouts |
| Seeds | `scripts/seed.mjs` + fixtures; seed∪overlay merge on boot with `seed_pack` stamp | Versioned system seed packs |

### 6.2 Operator rules for Records Editor

- Treat the running review board as **product truth** over stale memory  

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
| Layouts have no effect | Runtime not consuming saved layouts | Hard-reload; confirm the process was rebuilt; do not “fix” with a seed reset |
| Permission denied on shared host files | Wrong group/mode for `agi_agents` | chgrp agi_agents; 640 files / 2750 dirs as appropriate |
| Port already in use | Orphan next dev | Identify PID; stop intended instance only |
| Module factory / lucide crash | Dead import after icon swap | Remove unused import; rebuild; restart |

---

## 8. Open gaps

| Gap | Impact | Status |
|-----|--------|--------|
| Durable catalog overlay | D3 Primary-Org scope, D5 package API, Insert/Delete Sample Data | Shipped |
| VBA install skill | Host skill `business_admin` | Shipped |
| Production packaging (container/systemd unit) | Written customer install / unit file still thin | *TBD* |
| Automated post-deploy smoke script | Manual curls today | *TBD* |
| Postgres | Shipped default `DATA_SOURCE=postgres` + `.env.local` `DATABASE_URL` | Shipped |
| `migrate_agi_org` | Dry-run/apply; `--primary-source-org-id` required; host-org disable refused unless the Primary User asks | Shipped |

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
npm run db:status
npm run db:migrate
npm run db:seed

# Review board (example)
npx next dev --port 3200
```

---

## 10. Change log

| Date | Change |
|------|--------|
| 2026-11-24 | §5.2.16: upgrade to 1.0.19 (Versa pages as seven canvases; start-up adds new pack pages and canvases once and updates untouched canvas settings; log lines explained). |
| 2026-11-24 | §5.2.15: upgrade to 1.0.18, security fix (credential secrets encrypted at rest with `.data/data-key` or `VBA_DATA_KEY`, never returned by the API). §3.7: the key is not in backups; keep a copy apart. |
| 2026-11-23 | §5.2.14: upgrade to 1.0.17, security fix (signed sessions; everyone signs in again; `.data/session-secret` or `VBA_SESSION_SECRET`; `src/proxy.ts` replaces `src/middleware.ts`). |
| 2026-11-20 | §5.2.13: upgrade to 1.0.16 (Demo canvas guided tour, Transaction / Asset / Organization board drivers, Element filter, row headings, phone fixes; no build-time writes). Seed pack `1.0.16-r1` (Vehicle Mileage Logs under Custom Records). |
| 2026-11-19 | §5.2.12: upgrade to 1.0.15 (job costing on Transactions, Formula fields, Clone / Convert, Linked from). Seed pack `1.0.15-r1`. |
| 2026-11-19 | §3.7: `npm run backup`, uploads folder (`VBA_UPLOADS_DIR`), attachment limit. §5.2.11: upgrade to 1.0.14 (Attachments, Summary fields, Vehicle Mileage Log, statistics fed from records). Seed pack `1.0.14-r1`. |
| 2026-11-15 | §5.2.10: upgrade to 1.0.13. Statistics Table Add row + row delete; Enhanced UI shows every period. No migration, seed pack stays `1.0.12-r1`. |
| 2026-11-15 | §5.2: every upgrade runs `npm run db:migrate`; skipped versions are applied oldest first. §5.2.9: upgrade to 1.0.12. Statistics Period target, values edited in place (Table / Enhanced UI). No new migration. Catalog seed pack `1.0.12-r1`. |
| 2026-11-14 | §5.2.8: upgrade to 1.0.11. Spatial Twin bug fix on Custom Records → Statistics. No new migration. Catalog seed pack stays `1.0.10-r1`. |
| 2026-10-21 | §5.2.7: upgrade to 1.0.10. Hats record type. No new migration. Catalog seed pack `1.0.10-r1`. |
| 2026-10-14 | §5.2.6: upgrade to 1.0.9. Project task lines. Migration `0020`. Catalog seed pack `1.0.9-r1`. |
| 2026-10-04 | §4: the public GitHub checkout is pull-only. Agents do not commit product changes and do not `git push`. |
| 2026-10-02 | §5.2.5: upgrade an already-customized install to 1.0.8. Phone menu bug fix. No new migration. |
| 2026-10-02 | §5.2.4: upgrade an already-customized install to 1.0.7. No new migration. Catalog seed pack stays `1.0.6-r3`. |
| 2026-09-29 | §5.2.3: upgrade an already-customized install to 1.0.6. Catalog seed pack `1.0.6-r3` replaces free-text Status fields with picklists and adds Location Phone and Email. |
| 2026-09-28 | §5.2.2: upgrade an already-customized install to 1.0.5. `db:migrate` adds `auth_token`. |
| 2026-09-26 | §5.2.1: upgrade an already-customized install to 1.0.4. Keep `.data/site-settings.json` until the first boot copies it. §3.7 backup row matches. New-host list stays §2.8. |
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
| 2026-09-07 | 0.7.147: `migrate_agi_org` writes all AGi Org entities VBA can hold. Catalog seed pack 0.7.147 (treasury header+lines, Wave statuses). Credential secrets still not copied. |
| 2026-09-08 | 0.7.149: extra own Wave businesses migrate as Orgs (`internal`), not Collaboration Branch. One Primary (`is_primary`); additional Orgs allowed. Skill `business_admin` is host-generic (setup seeds `Versa-BusinessAdmin`; COA does not `project add`). `--disable-host-org` refused unless the PU asks. |
| 2026-09-08 | 0.7.150: Postgres is the shipped data source (`.env.local` `DATABASE_URL`). Fixture is opt-in. Credential Configuration has Show/Hide. Local provision script for PostgreSQL 16. |
| 2026-09-13 | Production is AWS Lightsail (app + Postgres). Firebase Hosting is retired. |
| 2026-09-16 | Public-safe manuals: product docs only; D1–D6 stay in §5; API catalog is `GET /api`. |
| 2026-09-16 | Enhance/deploy rules live in `WORKING_WITH_VBA.md` (was stale-UI note + UI patterns). |

---

*End of manual (living). Prefer amending this file over creating parallel ops guides.*
