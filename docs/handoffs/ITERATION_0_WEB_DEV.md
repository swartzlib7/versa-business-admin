# Iteration 0 — Foundations (web-dev)

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Models:** DeepSeek V4 Pro (you)  
**Date:** 2026-07-15  
**Git:** local `main` (project type temporarily `local` so assignment works without remote; still a real git repo under the path)

## Product in one line
Client **mission control** for a Versa AGi-powered business — **not** AGI Top. White-label (logo/theme/colors). **API required** so Versa AGi agents can use the system.

## Stack (locked preferences)
- **React** + **R3F** (`@react-three/fiber`, `@react-three/drei`) — non-negotiable preferences
- **Next.js** App Router as default shell (routing + API routes)
- Tailwind + shadcn/ui
- Prefer stable, well-supported packages
- Modular / easy to extend

## Your job this iteration
Turn the docs-only repo into a bootable app skeleton.

### Deliverables
1. Next.js (App Router) + TypeScript + Tailwind scaffold in the project root (or `src/` if you prefer — document choice in README).
2. shadcn/ui initialized with a minimal set of primitives (button, card, etc.).
3. App shell: sidebar + header + main content placeholders with mission-control framing (not “AGI Top”).
4. Placeholder routes: Dashboard, Integrations/Systems, Agents, Projects/Work, Tasks, Settings (white-label tokens).
5. Fixture data module (JSON/TS) for sample agents, projects, integrations, tasks.
6. **API stub** via Next.js route handlers (or equivalent), fixture-backed, e.g.:
   - `GET /api/health`
   - `GET /api/agents`
   - `GET /api/projects`
   - `GET /api/integrations` (or systems)
   - `GET /api/tasks`
7. Minimal R3F canvas placeholder on Dashboard (even a simple scene) so the 3D path is real, not theoretical.
8. README: install, run, test, API base paths.
9. Basic smoke: `npm install && npm run build` (or `dev` documented) works from clean tree.
10. Commit on `main` (or `feat/i0-scaffold` then merge) with clear message.

### Out of scope for I0
- Real Versa AGi host integration
- Auth
- Full QA agent / Playwright suite (light self-check is enough)
- Public website / agent chat UI
- Perfect visual design

## Acceptance criteria (COA will check)
- [ ] Clean install + dev server starts
- [ ] Shell navigates between placeholder pages
- [ ] White-label tokens exist (CSS variables or theme config for logo/colors)
- [ ] At least health + one resource API returns fixture JSON
- [ ] R3F canvas mounts without error
- [ ] README is accurate
- [ ] Repo remains modular (clear folders: app/ui, api, fixtures, components)

## Docs to read first
- `docs/specs/PRODUCT_SPECIFICATION.md`
- `docs/specs/PRODUCTION_PLAN.md`
- `docs/research/LAYOUT_PROPOSAL.md`
- `docs/research/RESEARCH.md`

## Handoff back to COA
When done, message COA with:
- how to run
- commit SHA
- any stack deviations and why
- blockers

Then set your task to waiting/done as appropriate and leave task progress notes.
