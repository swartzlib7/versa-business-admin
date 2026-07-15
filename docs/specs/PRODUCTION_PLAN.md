# Production Plan — Versa Admin System

**Project ID:** 26 (`versa-admin-system`)  
**Game:** #109 Versa Voice AI LLC  
**Created:** 2026-07-14  
**Status:** Decisions locked 2026-07-15 — Iteration 0 authorized  

**Product framing:** Client **mission control** for a Versa AGi-powered business (integrations, systems, ops). **Not AGI Top.** White-label (logo/theme/colors). Public website + agent chat is a later track. **API required** so Versa AGi agents can use the system (not UI-only).

---

## 1. Division of Ownership

| Area | Owner | Notes |
|------|-------|-------|
| Product vision & distribution into Versa AGi | **Stephen** | Packaging, install path, host contracts, remotes |
| Planning, prioritization, acceptance | **COA (Versa)** | Specs, iteration design, task orchestration |
| Implementation | **web-dev** | Next.js / shadcn / R3F build |
| Quality / regression | **QA agent (recommended new hire)** | Test plans, E2E, acceptance checks |
| Architecture of *this host’s* AGi core | Out of scope | Product stays standalone |

Stephen’s direction is explicit: he handles architecture/distribution; we build the product.

---

## 2. Team Model

### 2.1 Core cast (recommended)

| Role | Agent | Model recommendation | Why |
|------|-------|----------------------|-----|
| Orchestrator / PM | **coa** | Keep current strong reasoning model for planning cycles | Specs, handoffs, acceptance |
| Developer | **web-dev** (existing) | **DeepSeek V4 Pro** (already assigned) | Complex UI + R3F + Next.js |
| Tester | **qa** (new — role `qa`) | **DeepSeek V4 Flash** | Cheap, fast regression & test authoring |
| Optional research spikes | **researcher** (existing, only if needed) | Flash | Library comparisons, not standing member |

### 2.2 Do we need a dedicated tester?

**Yes — recommended, but phased.**

| Option | When | Pros | Cons |
|--------|------|------|------|
| **A. Hire QA agent now** | Best if we expect multi-week build | Clean handoffs, independent acceptance | Needs dashboard approval; another active agent |
| **B. Defer QA hire; web-dev self-tests + COA smoke** | First 1–2 iterations only | Faster start, fewer agents | Weaker independent verification |
| **C. No QA ever** | Not recommended | — | Quality debt on a product you will distribute |

**Stephen decision (2026-07-15):** QA timing is flexible — hire when needed. Fun name OK.

**Operating rule:** Start **without** QA (Option B). Hire QA when we need independent verification (target: before/at Iteration 2 feature surfaces). Proposed fun names when hiring: **Prism**, **Gauge**, **Verity**, **Beacon** (pick one or invent).

### 2.3 Proposed QA agent (when approved)

```text
Name:  qa   (or tester if you prefer the display name)
Role:  qa   (QA Agent template)
Model: deepseek/deepseek-v4-flash
```

COA will run `agictl agent add qa --role qa` only after you confirm the name. You approve in agitop; then we assign the agent to project #26.

### 2.4 Models (your shortlist applied)

Confirmed models: **DeepSeek V4 Flash** and **DeepSeek V4 Pro** only (Stephen clarified "Flash" alone was a stutter). Mapping:

| Work type | Model | Agent |
|-----------|-------|-------|
| Architecture notes, specs, hard debugging | Stronger model (COA current / Pro when needed) | coa |
| Feature implementation, R3F, Next.js | **deepseek/deepseek-v4-pro** | web-dev |
| Test writing, checklist runs, log triage | **deepseek/deepseek-v4-flash** | qa (and light COA ops) |
| Quick research spikes | Flash | researcher (ad hoc) |

No need for a third developer model unless Pro struggles with a specific stack issue.

---

## 3. Iteration / Handoff Engine

Goal: **one agent finishes a slice, hands a crisp package to the next**, across cycles.

### 3.1 Standard iteration loop

```
COA: define slice + acceptance criteria (task)
   → web-dev: implement on feature branch (task)
      → QA (or COA smoke early on): verify against criteria (task)
         → COA: accept / request fixes / plan next slice
```

### 3.2 Handoff artifact (every handoff)

Each completing agent leaves:

1. **Task progress journal** — `DONE / NEXT / BLOCKERS`
2. **Short status message** to the next agent (internal) + COA
3. **Branch name + commit SHA** (when code exists)
4. **Acceptance checklist** results (pass/fail per item)

### 3.3 Task conventions

| Field | Convention |
|-------|------------|
| Title | `[admin I{n}] <slice> — <role>` e.g. `[admin I2] Agent fleet table — web-dev` |
| Project | always `#26` |
| Assignee | the agent who must act |
| Status | `waiting` when blocked on another agent or Stephen |
| Desc | includes acceptance criteria bullets |

### 3.4 Branching

| Branch | Purpose |
|--------|---------|
| `main` | Always bootable scaffold / accepted work |
| `feat/i{n}-short-name` | One iteration slice |
| `test/i{n}-…` | Optional QA-only branches if needed |

Remote: **none yet** — local git only until Stephen provides URL.

### 3.5 Cadence

- **1 vertical slice per iteration** (not “finish the whole admin”).
- Prefer **thin end-to-end** (UI + fixture data + one test) over deep unfinished layers.
- COA re-plans after each accepted slice.

---

## 4. Iteration Roadmap

### Iteration 0 — Foundations (now → next)

**Owner:** COA + web-dev  
**Outcome:** Repo is a real app skeleton, not just docs.

- [x] Project registered (#26), local git initialized  
- [x] Research seed copied into `docs/research/`  
- [x] Production plan + product spec written  
- [ ] web-dev: Next.js + Tailwind + shadcn scaffold in `src/` (or app root as appropriate)  
- [ ] README: install, run, test commands  
- [ ] Fixture data module for agents/projects/games/tasks  
- [ ] COA smoke: app starts, empty shell renders  

**Exit criteria:** `npm install && npm run dev` (or equivalent) works from a clean clone of this repo.

### Iteration 1 — Shell + navigation

**Owner:** web-dev → COA smoke  

- App shell: sidebar, header, placeholder routes  
- Nav items: Dashboard, Agents, Projects/Games, Tasks, Settings  
- Theme tokens aligned with research config sample  
- Basic responsive layout  

### Iteration 2 — First operational surface + independent QA

**Owner:** web-dev → **QA** (hire before this iteration)  

- Agents fleet table from fixtures  
- Projects/Games list with parent game grouping  
- First Playwright smoke suite  
- COA acceptance  

### Iteration 3 — Hybrid main view (2D + R3F viewport)

**Owner:** web-dev → QA  

- R3F canvas in main content (per layout proposal)  
- Default graph: Games → Projects nodes  
- Click node → filter/highlight 2D panel  

### Iteration 4 — Tasks surface + system widgets

**Owner:** web-dev → QA  

- Tasks table with status/priority filters  
- Dashboard widgets (counts, simple health cards)  
- Deeper fixture scenarios  

### Iteration 5 — Host contract & packaging hooks

**Owner:** COA specs + web-dev stubs; **Stephen** packaging  

- Document config/env contract the product expects from Versa AGi  
- Stub adapters (file/API) behind a clear interface  
- Stephen begins distribution work in parallel  

### Later iterations

- Live data adapters (when host contract exists)  
- Auth/session per Stephen’s distribution design  
- Richer 3D (agent activity pulses, timelines)  
- Performance pass, accessibility, polish  

---

## 5. How We Run This in Versa AGi

1. **Project #26** is the single source of truth for files and tasks.  
2. **Assign agents** to the project when work starts:  
   - `agictl project assign 26 --agent web-dev`  
   - later: `agictl project assign 26 --agent qa`  
3. **COA creates the next iteration tasks** only after the previous slice is accepted (or explicitly parallelized).  
4. **Internal messages** for agent-to-agent handoffs; Stephen gets milestone summaries, not every micro-step.  
5. **Git remote** added later via `agictl project update 26 --remote <url>` when you provide it.  
6. **Building-phase rules:** setup/purge scripts must rebuild from zero; no “manual snowflake” steps.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scope expands into full agitop replacement | MVP surfaces locked in Product Spec; COA gates new asks into later iterations |
| R3F complexity stalls UI | Iteration 1 ships pure 2D shell; 3D starts Iteration 3 |
| No remote yet | Local git is fine; commits stay local until you add remote |
| Agent overload / cost | Flash for QA & light work; Pro only on web-dev implementation |
| Host integration unknown | Keep adapters behind interfaces; Stephen owns distribution |

---

## 7. Decisions from Stephen (2026-07-15) — CLOSED

| # | Topic | Decision |
|---|--------|----------|
| 1 | QA timing | Flexible — hire when needed |
| 2 | QA name | Fun name OK; communicates quality |
| 3 | Git remote | Later; do not block |
| 4 | Stack | React + R3F preferred; Next.js OK if sensible; stable components; modular |
| 5 | MVP / design | **API for agents** + modular/extensible architecture |

---

## 8. Next Actions (in progress)

1. Assign **web-dev** to project #26.  
2. Create Iteration 0 scaffold task (Next.js + React + R3F seed + API stub + fixtures).  
3. Defer QA hire until needed (fun name then).  
4. Add git remote when Stephen provides URL (`project update 26 --remote`).
