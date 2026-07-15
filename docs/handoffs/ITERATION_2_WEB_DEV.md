# Iteration 2 — Agent API depth + operational Agents surface

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Models:** DeepSeek V4 Pro  
**Depends on:** Iteration 1 accepted (commit f851d62)  
**Date:** 2026-07-15  

## Goal

Make the **agent API** the product’s first-class surface (Stephen’s MVP design requirement), and turn the Agents page into a real operational fleet view — not just a fixture list. Keep host integration stubbed behind a clear adapter.

## Context (what already shipped)

I0+I1 delivered shell, settings white-label preview, list APIs with `?status=`, API contract, and R3F click→Dashboard detail. **Do not re-do I1 work.** Soft debt: `package.json` version is still `0.1.0` while API/health report `0.2.0`.

## Deliverables

### 1. Version hygiene
- Set `package.json` `version` to **0.2.0** (match API contract / health).
- Keep README / contract version strings consistent.

### 2. Agent API depth
- `GET /api/agents/[id]` — single agent by id; **404** with documented error shape when missing.
- Keep list `GET /api/agents` + `?status=` as-is (or improve if needed).
- Update `docs/api/API_CONTRACT.md` and `GET /api` index if new routes appear.
- **Optional experimental:** `PATCH /api/agents/[id]` body `{ status: ... }` mutating the in-memory/fixture store for the process lifetime. Label clearly as experimental in contract + README. Skip if it risks build complexity — note in handoff.

### 3. Data adapter (modular boundary)
- Introduce a thin data-access layer, e.g. `src/lib/data/` or `src/lib/adapters/`:
  - Interface: listAgents / getAgent (and listProjects if convenient)
  - `fixture` implementation used by all route handlers
- UI and routes should not import fixture arrays directly where an adapter call is cleaner.
- No real Versa AGi host wiring yet — interface only + fixture impl.

### 4. Agents operational UI
- Agents page: proper **fleet table** (name, role, status, model, last active) fed via API or adapter (not hard-coded JSX dumps).
- **Detail:** route `/agents/[id]` **or** in-page detail panel when a row is selected.
- Status badge styling consistent with Dashboard / R3F colors.
- Empty + loading states retained/improved.
- Deep-link friendly if using a detail route.

### 5. Projects surface (light)
- Projects list shows **parent game** (name/id already on fixtures) — group by game **or** clear game column/badge.
- No new mutation APIs required for projects this iteration.

### 6. Quality bar
- `npm run build` clean
- README: document agent detail endpoint, adapter pattern, version 0.2.0, how to demo Agents table + detail
- Commit with clear message
- Handoff to COA: SHA + demo steps + anything deferred

## Out of scope
- Real host / live data adapters
- Auth
- Playwright suite / QA agent hire (COA will smoke-test; hire when E2E is needed)
- Public website / agent chat
- Broad write APIs beyond optional experimental agent status PATCH
- Replacing R3F work from I1

## Acceptance criteria
- [ ] package.json version is 0.2.0
- [ ] `GET /api/agents/<id>` returns agent JSON; unknown id → 404 error shape
- [ ] API_CONTRACT.md documents detail (and optional PATCH if implemented)
- [ ] Fixture-backed adapter interface exists; routes use it
- [ ] Agents page is a usable fleet table with detail view/panel
- [ ] Projects list surfaces parent game
- [ ] Build clean; README accurate
- [ ] Handoff message to COA with SHA + demo notes

## Read first
- `docs/specs/PRODUCT_SPECIFICATION.md` §5–6 (API + MVP)
- `docs/specs/PRODUCTION_PLAN.md` §4 Iteration 2 (updated)
- `docs/api/API_CONTRACT.md`
- `docs/handoffs/ITERATION_1_WEB_DEV.md`
- Existing `src/app/api/agents/route.ts`, `src/lib/fixtures/agents.ts`

## Demo notes for handoff
1. `npm run dev` → open `/agents` — table populated  
2. Open an agent detail (row click or `/agents/agent-1`)  
3. `curl /api/agents/agent-1` and `curl /api/agents/missing` (expect 404)  
4. If PATCH implemented: show status change reflected in UI after refresh  
