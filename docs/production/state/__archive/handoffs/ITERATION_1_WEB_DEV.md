# Iteration 1 — Shell polish + API contract + 3D↔2D link

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Models:** DeepSeek V4 Pro  
**Depends on:** Iteration 0 accepted (commit 8ddaac4)  
**Date:** 2026-07-15  

## Goal
Make the mission-control shell feel intentional, document a stable agent-facing API contract, and prove one real interaction between the R3F scene and the 2D panels.

## Deliverables

### 1. Shell / UX polish
- Consistent empty/loading states on list pages
- Active nav highlight that matches current route
- Settings page: editable white-label preview (brand name + primary color at minimum; local state OK)
- Remove leftover Create Next App / Vercel marketing chrome if any remains
- Accessible focus states on primary nav controls

### 2. API contract (agent-ready)
- Add `docs/api/OPENAPI_STUB.md` or `docs/api/API_CONTRACT.md` describing:
  - Base path `/api`
  - Resources: health, agents, projects, integrations, tasks
  - Response envelope convention (`data` + `count` where list)
  - Error shape (even if not fully implemented)
- Optional: `GET /api` index listing available endpoints
- Keep fixture-backed; no real host integration yet
- At least one resource supports query filter (e.g. `?status=active` on agents or tasks)

### 3. 3D ↔ 2D linkage (minimum viable)
- Dashboard R3F nodes represent fixture entities (agents and/or projects)
- Clicking a node focuses related 2D content (highlight card, filter list, or side detail panel)
- Document the interaction in README

### 4. Quality bar
- `npm run build` still clean
- README updated for new API filters + 3D interaction
- Commit with clear message

## Out of scope
- Real Versa AGi host wiring
- Auth
- Playwright suite / QA hire
- Public website / chat UI
- Write/mutation APIs (POST/PATCH) unless trivial and documented as experimental

## Acceptance criteria
- [ ] Settings can preview brand name + primary color
- [ ] API contract doc exists and matches live routes
- [ ] At least one list endpoint supports a query filter
- [ ] Clicking a 3D node updates 2D UI meaningfully
- [ ] Build clean; README accurate
- [ ] Handoff message to COA with SHA + how to demo the 3D click

## Read first
- `docs/specs/PRODUCT_SPECIFICATION.md` §5–6
- `docs/handoffs/ITERATION_0_WEB_DEV.md` (context)
- Existing `src/components/r3f/mission-control-scene.tsx`
