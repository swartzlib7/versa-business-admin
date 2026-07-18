> **Historical handoff (I5.4 — accepted).** The hub+3-ring **Sales / Accounting / Teams / Surfaces** graph was the **transitional** implementation.  
> **Conceptual ERD source of truth is now** `docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` **v1.1** (Organization / Collaboration / Environmental).  
> Do **not** start a new build from this file’s ring model. Future 3D/nav work = **I5.5** when COA opens it.

---
# Iteration 5.4 — 3D hub visualization (Versa AGi middleware graph)

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Depends on:** I5.3 accepted on beta (`6277c32` / `bb1588b` + health `deea3ed`)  
**Date:** 2026-07-17  
**Branch:** `agent/web-dev`  
**COA task:** #165 (orchestration)

## Goal

Stephen confirmed the layout and brand direction for a **polished 3D visualization** of Mission Control:

> Versa AGi as the **central hub / integration middleware**, with logical spokes to business systems, teams, and operating surfaces — not decorative fluff.

Evolve the existing R3F scene (`src/components/r3f/mission-control-scene.tsx`) from an agents/projects cluster into a **hub-and-spoke business graph**.

## Confirmed decisions (Stephen 2026-07-17)

| Decision | Value |
|----------|--------|
| Layout | Hub + **3 orbital rings** (as COA proposed) — confirmed great / perfect |
| Brand | **Versa-branded by default**; customers can **rebrand / white-label** for themselves |
| Theme | **Dark mode + light mode** (same dual-theme approach already in the product) |
| Tone | Logical and polished — readable at a glance, not a random star field |

## Graph structure

### Hub (center)
- **Versa AGi** / Mission Control — single clear core node
- Soft pulse / glow; calm operating brain, not a logo dump
- Label: "Versa AGi" (or short "Versa") with optional subtitle "Mission Control"

### Ring 1 — Business systems (inner)
| Node | Notes |
|------|--------|
| Sales | Placeholder system |
| Production | Placeholder system |
| Accounting | Placeholder system |

### Ring 2 — People / teams (mid)
| Node | Notes |
|------|--------|
| Local team | On-site / HQ |
| International team | Remote / multi-region |

### Ring 3 — Operating surfaces (outer)
| Node | Notes |
|------|--------|
| Dashboards | Visibility |
| Automations | Workflows / agents |
| Reporting | Exports / reviews |

### Connections
- **Primary:** animated lines **hub → each node** (middleware feel)
- **Optional secondary:** thin links between related systems (e.g. Sales → Accounting) so it reads as integration, not only a star chart
- Keep motion subtle (auto-rotate already exists — preserve damping / orbit controls)

## Brand + theme requirements

1. **Versa default brand**
   - Hub and chrome should read as Versa AGi product demo (not Northstar-only public brochure).
   - Use existing `src/lib/theme.ts` brand tokens where practical; extend if needed for Versa product naming on this surface.
   - **White-label path remains:** theme tokens / brand config must still allow a customer rebrand later (do not hard-code logos into geometry beyond replaceable materials/labels).

2. **Dark + light mode**
   - Scene container, grid, labels, and materials must look correct in **both** dark and light.
   - Prefer CSS variables / theme-aware colors over hard-coded pure black/white that only work in one mode.
   - Existing shell already has `dark:` utilities — match that pattern for the canvas chrome and HTML overlays.

## Where it lives

### Primary (required)
- Authenticated / product shell surface that already hosts `MissionControlScene` (dashboard or Mission Control view — keep current mount point unless a cleaner home is obvious).
- Replace or substantially rework node model: stop treating the scene as only agents + projects for this viz. Prefer a dedicated **business-graph fixture** (systems / teams / ops) so the graph is stable and demoable.

### Optional (nice-to-have, same iteration if cheap)
- Lighter / smaller embed of the same graph on the **public** Mission Control homepage (I5.3 facets page) — only if it does not bloat the public bundle or fight the white-label public sample. If public stays Northstar-facing, keep the full Versa hub on the product shell only.

## Technical notes

- Stack already present: `@react-three/fiber`, `@react-three/drei`, `three`
- File: `src/components/r3f/mission-control-scene.tsx` (and split helpers if the file grows)
- Add fixtures e.g. `src/lib/fixtures/business-graph.ts` (or similar) for hub + ring nodes
- Types: extend or replace `SceneNode` so `type` covers `hub | system | team | surface` (or equivalent)
- Category colors: systems vs teams vs ops must be **obvious at a glance**
- Interaction: hover labels; click → short detail card (status / "connected" / one-line description) — reuse existing focus pattern if possible
- Agents/projects data: either remove from this scene for I5.4, or demote to a secondary mode — **do not** leave a confusing dual graph. Prefer clean business graph for this iteration.

## Deliverables

1. Hub + 3-ring R3F graph as specified
2. Versa-branded default + dual theme (dark/light)
3. Fixture-driven nodes (no real integrations required)
4. Build clean; smoke on preferred demo port **:3100**
5. README one-liner for I5.4
6. Commit on `agent/web-dev`; handoff SHA + smoke steps to COA

## Out of scope

- I7 org structure
- Real live data from Wave / ERP / external systems
- Full public rebrand away from Northstar facets (I5.3 stays)
- New 3D engine or abandoning R3F
- Heavy particle systems / game-like FX that hurt readability

## Acceptance criteria

- [ ] Center hub clearly reads as **Versa AGi** middleware
- [ ] Three rings present: systems (Sales, Production, Accounting), teams (Local, International), ops (Dashboards, Automations, Reporting)
- [ ] Hub→node connections visible; scene is logical and polished
- [ ] **Dark mode and light mode** both look intentional
- [ ] Default brand is Versa; rebrand path not painted into a corner
- [ ] `npm run build` clean; COA can smoke on :3100
- [ ] Handoff SHA on `agent/web-dev`
- [ ] Do **not** start I7

## Stephen quotes (intent)

> Yeah, this layout feels right. I think it's GREAT.
> We can Versa brand it … they can REBRAND it for themselves.
> Dark mode and a light mode like we have now. Other than that, sounds PERFECT.

## COA notes for web-dev

- Prefer :3100 for demo (not :3099 leftover).
- Path A locked (Next).
- After handoff, stand by — no I7 until explicitly tasked.
