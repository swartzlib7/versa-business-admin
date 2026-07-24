# Mission Control — Living Work Breakdown (WBS)

> **Owner:** Versa (COA) with Stephen  
> **Product:** versa-admin-system (Mission Control) · Project #26 · Game #109  
> **Purpose:** One easy table view of where we are and what “Phase N” means.  
> **Last updated:** 2026-07-23 02:45 EDT  
> **How to use:** Scan the **At a glance** table first. Detail lives in the linked state docs — this file is the map, not a second source of truth for ERD/UI.

---

## At a glance

| Track | What it is | Status now | Waiting on |
|-------|------------|------------|------------|
| **A. Hub / org-board UI** | 3D + zone IA + Records Editor | **I5.6.32c+** Settings section tabs; sample Public/Treasury fixture types removed; Records Editor nested sections | Stephen: preview Settings tabs + empty faculty Records |
| **B. DB cutover** | Move data from fixtures → Postgres (Drizzle) | **Phase 0–2**: seed script + User list/get + bcrypt login; hybrid adapter (Users from PG, rest fixture) | Phase 3 User writes authorized 2026-07-23 (POST/PATCH /api/users) |
| **C. Broader Mission** | API writes, more zones, polish, production | Later phases | After B Phase 2–4 |

### Canonical preview (how to open the app)

| Item | Value |
|------|-------|
| **URL** | http://localhost:3100 |
| **Who runs it** | COA smoke from **beta** (next start -p 3100) |
| **Who builds the code** | Web-dev on agent/web-dev; COA merges/mirrors to beta |
| **Do not use** | :3000 (nothing listening), :3101 (stale old build), random orphan dev ports |
| **What you see today** | Settings tabs + Records Editor; Users can come from Postgres when DATA_SOURCE=postgres; hub still mostly fixture |

When COA says **“Phase 2”** without other context, it means **Track B — DB cutover Phase 2** (seed data + read User pilot from Postgres). It is **not** a phase of the whole company or of hub visuals.

---

## Track A — Hub / org-board (I5.6 line)

| Item | Status | Notes |
|------|--------|-------|
| I5.6 UI wrap | Complete | Public v1 preserved; beta carries work |
| Org-board deltas (2026-07-21) | Shipped `2dc9b41` | Executive = center sphere; Public at top (+Y); Service & Product **not** hub spheres (nested under Production); no clickable Executive label; Object Label **Name** |
| Spec go-to file | `docs/design/spec/state/state_i5_6_zone_erd.md` | Sole living board/ERD/IA doc |
| Org zone Configuration IA | Shipped `7ebcc7e` | Production=Configuration; faculties Config+list where agreed; list schemas TBD (#183) |
| Spatial twin drawer (I5.6.31) | **Shipped this cycle** | Hideable right twin on Org/Collab/Env; localStorage per zone; main content expands when hidden |
| Hub spheres static + 3D (I5.6.31) | **Shipped** @ `30f9d2d` | animSpeed default 0; directional lighting + metal/roughness + rim shells |
| I5.6.32a menu + Qual Records | **Shipped** | Sidebar drops Projects/Tasks/Products; Qualification + Records; routes kept for deep link |
| I5.6.32 dynamic records plan | **Plan locked** | `docs/coa/I5_6_32_DYNAMIC_RECORDS_REDESIGN.md` — keep Projects/Tasks first-class; config-driven faculty Records |
| I5.6.32b catalog schema API | **Shipped** | `/api/catalog` read + POST fields extend; agents discover schema |
| I5.6.32c Record Type Editor | **Definition ready** | `docs/coa/I5_6_32c_RECORD_TYPE_EDITOR.md` — await Stephen review then build |
| Shortcuts / favorites nav | Backlog | Stephen: revisit later |
| Visual confirm | **Received** | Hub looked good 2026-07-22 |

**Not the go-to for board layout:** `state_db_cutover_checklist.md`, `state_api_contract.md`, archive under `state/__archive/`.

---

## Track B — DB cutover (fixture → Postgres)

**Go-to detail doc:** `docs/design/spec/state/state_db_cutover_checklist.md`  
**Idea in one line:** Keep the app running on fixture data by default; build a real Postgres path behind a switch; turn it on one slice at a time with your OK each phase.

### Phase map (Track B only)

| Phase | Name | What gets built | Status | Gate |
|-------|------|-----------------|--------|------|
| **0** | Decisions | ORM, hosting, agents-as-users, session, API agents removal timing | **Done** | Stephen signed 2026-07-21 |
| **1** | Scaffold + empty migrate | Drizzle schema (~12 tables), client, Vagrant Postgres on knowledgebase box, migrate, `/api/health` DB ping | **Done** | Runtime path proven; origin `agent/web-dev` + beta |
| **2** | Seed + **read** pilot | Seed script from fixtures; read **User** (+ org/dept/catalog/auth as needed) from Postgres when flag on | **Not started** | **Needs your explicit go** |
| **3** | Writes | POST/PATCH via adapter (create/update users, projects, tasks, …) | Not started | After Phase 2 accepted |
| **4** | Roll remaining reads + cleanup | Projects/tasks/products/integrations/staff; remove `/api/agents*` | Not started | After Phase 3 accepted |

### Phase 0 — locked decisions (summary)

| Topic | Decision |
|-------|----------|
| ORM | **Drizzle** (stays even if Supabase later) |
| Local DB | **Vagrant Postgres** on existing **knowledgebase** box (not Docker, not MySmartYard box, not a new box) |
| Later cloud | Supabase optional later; still Drizzle client |
| Agents | Agents are **users** (type=agent); no separate agents table; Mission stays out of AGi agitop internals |
| Session P1–P2 | Keep current httpOnly cookie approach |
| `/api/agents*` | Remove in **Phase 4**, not earlier |

### Phase 1 — delivered (commits / path)

| Deliverable | Ref / note |
|-------------|------------|
| Schema scaffold | `bdb891d` (12 tables, no agents table) |
| Vagrant Postgres path + docs scrub | `0f93935` (+ beta mirror) |
| Health helper polish | `c9f16ff` |
| Deploy key | Working — web-dev pushes `agent/web-dev` |
| Default data source | Still **fixtures** until Phase 2+ flag |

### Phase 2 — what “go” unlocks (plain language)

| Include | Exclude (until later phase) |
|---------|------------------------------|
| Seed script: load fixture data into Postgres | Full production cutover |
| Read path for **User** pilot (list/get) | Write APIs (Phase 3) |
| Auth login against DB password hashes (as designed) | Rolling all other resources (Phase 4) |
| Org / departments / catalog as needed for User FK integrity | Environment zone entities (Location, Event, …) |
| Feature flag so we can flip back to fixtures | Sharing host AGi Organization DB |

**Acceptance sketch (from checklist):** seed runs clean; User read works with postgres data source flag; fixture default still safe; no broader cutover without a new go.

---

## Track C — After cutover (parking lot)

| Theme | When | Notes |
|-------|------|-------|
| Write APIs + validation vs field catalog | Phase 3 | |
| Rest of read surface + agents API removal | Phase 4 | |
| Managed/production Postgres (e.g. Supabase) | After local path trusted | Swap connection string; keep Drizzle |
| Environment zone entities | Deferred | Documented in ERD, not in Phase 1–4 |
| Hub visual experiments | Closed | I5.6.28 line |

---

## Who does what

| Role | Owns |
|------|------|
| **Stephen** | Phase gates (go / hold); visual confirm hub; product direction |
| **Versa (COA)** | This WBS; brief web-dev; review commits; mirror beta; no Phase N without your go |
| **Web-dev** | Implementation on `agent/web-dev`; hold Phase 2 until authorized |

---

## Open asks (Stephen)

1. **Hub visual confirm** — org-board @ `2dc9b41` (when home).  
2. **Phase 2 go or hold** — seed + User read pilot only (Track B).
3. **Org list definitions** — what rows mean under Public / Communications / Dissemination / Treasury / Qualification.  
4. Optional: tell COA if this WBS layout should change (more/less detail, different sections).

---

## Doc index (don’t get lost)

| File | Use for |
|------|---------|
| **This file** `docs/coa/MISSION_CONTROL_WBS.md` | Status + phase names in plain language |
| `docs/design/spec/state/state_i5_6_zone_erd.md` | Org board, zones, baseline model |
| `docs/design/spec/state/state_db_cutover_checklist.md` | Full DB cutover checklist & acceptance |
| `docs/design/spec/state/state_api_contract.md` | API contract |
| `docs/design/spec/state/state_layout_mission_ui.md` | Layout / Mission UI |

---

*COA updates this file when phase status or gates change. Prefer editing here over scattering “where are we?” across chat.*
