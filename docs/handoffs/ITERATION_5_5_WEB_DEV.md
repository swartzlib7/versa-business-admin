# Iteration 5.5 — Keystone ERD in 3D + nav remap

**Project:** versa-admin-system (#26)  
**Assignee:** web-dev  
**Depends on:** Keystone v1.1 on beta (`c721635`); I5.4.1 line clarity (`0bf3c58`)  
**Date:** 2026-07-18  
**Branch:** `agent/web-dev`  
**COA orchestration:** task created this cycle  

## Goal

Implement Stephen’s **Mission Control keystone ERD v1.1** in the product shell:

1. Replace the transitional I5.4 business graph (Sales / Accounting / Teams / Surfaces) with the **three-zone** model.  
2. **3D presentation** upgrades: lightbox expand, billboard labels, Organization rim label, department spheres.  
3. **Nav remap** per keystone (Projects/Tasks under Executive path; Integrations under Product; no agent chrome).  
4. **System information** blurb (business Mission Control vs agitop).

**Source of truth (read first, do not invent a parallel model):**

`docs/specs/MISSION_CONTROL_ERD_KEYSTONE.md` (v1.1)

Also: `docs/specs/PRODUCT_SPECIFICATION.md`, `docs/_notes/ALIGNMENT_CHECKLIST.md`.

**I7 remains CLOSED.** Do not build divisions→sections→units hierarchy UI. Do not expand agent-fleet features.

---

## Binding product rules (do not violate)

| Rule | Detail |
|------|--------|
| Agents | **User `type` only** (`human` \| `agent`). No Active Agents, Agent Status, fleet tables, or agent-ops chrome. |
| Product vs agitop | This app = **business** Mission Control. agitop = Versa AGi internal ops. |
| Organization nodes | **Departments as spheres**: Executive, Communications, Dissemination, Treasury, Production, Qualification |
| Branch | **Subsidiary** |
| Locations | **Global address book** (no map required this iteration) |
| Integrations | Always under **Product** (dashboard OK; data concept = factor of Product) |
| Brand | Authenticated viz: **Versa AGi** hub naming; white-label path remains via theme tokens |
| Public sample | Keep Northstar-style public template unless change is free and non-conflicting — full public rebrand is **out of scope** |

---

## Graph structure (replace fixtures)

### Zones (rings)

| Ring | Zone | Role |
|------|------|------|
| 0 / center treatment | Brand + Organization zone | Versa AGi identity + Organization rim label; department spheres |
| 1 (inner) | **Organization** | Department spheres |
| 2 (mid) | **Collaboration** | Parties |
| 3 (outer) | **Environmental** | Context entities |

### Organization (ring 1) — departments as spheres

| id (suggested) | Label | Position intent |
|----------------|-------|-----------------|
| executive | Executive | Center among org spheres (not a second product hub brand) |
| communications | Communications | Left of center |
| dissemination | Dissemination | Right of center |
| treasury | Treasury | Back |
| production | Production | Front |
| qualification | Qualification | Bottom |

### Collaboration (ring 2)

| id | Label | Notes |
|----|-------|--------|
| vendor | Vendor | AKA Service Provider |
| customer | Customer | Person or Business |
| partner | Partner | Business or Investor |
| branch | Branch | Subsidiary |

### Environmental (ring 3)

| id | Label | Notes |
|----|-------|--------|
| locations | Locations | Address book |
| events | Events | Past or future planned activity |
| knowledge | Knowledge | Docs, recordings, photos, policies, research |
| schedules | Schedules | Calendar-like agreements |
| product | Product | Device, manufactured item, or file |
| service | Service | Faculty for results (e.g. Analysis & Design) |

### Brand node

- Keep a clear **Versa AGi** brand treatment (pulse/glow OK).  
- **Do not** confuse brand hub with Executive: Executive is an Organization **department** sphere.  
- Flat label **“Organization”** along the edge of the Organization circle/zone.

### Links

- Primary: sensible spokes (brand/zone center → nodes, or zone-appropriate).  
- Optional secondary: a few cross-links that read as “configure across zones” (e.g. Customer → Product, Production → Schedules, Executive → Customer) — keep sparse and readable.  
- Preserve subtle auto-rotate / orbit controls / dark+light materials from I5.4.1.

### Types

Replace `hub | system | team | surface` with something like:

`brand | organization | collaboration | environmental`  
(or `hub | department | party | context` — pick one scheme, document in fixture file header).

Update `mission-control-scene.tsx` colors/sizes per zone (departments should read as **spheres**).

---

## 3D UX requirements

| Requirement | Acceptance |
|-------------|------------|
| **Lightbox expand** | Toggle expands the 3D view into a **near-fullscreen lightbox/modal overlay** — **not** `requestFullscreen` / F11 browser fullscreen |
| **Billboard labels** | Node labels always face the camera |
| **Organization rim label** | Readable flat label on Organization zone edge |
| **Click detail** | Click node → detail card (label, zone, short description, status) — reuse existing focus pattern |
| **Dark + light** | Scene correct in both themes |
| **Performance** | No obvious jank with ~16 nodes + links |

---

## Navigation remap (shell)

Current sidebar (`src/components/shell/sidebar.tsx`):

- Dashboard, Integrations, Users, Projects, Tasks, Settings  

**Target information architecture (minimal viable for I5.5):**

| Item | Action |
|------|--------|
| Dashboard | Keep |
| Users | Keep |
| Settings | Keep |
| Projects | Nest under **Executive** grouping (label path: Executive → Projects). If nested routes are heavy, use href `/executive/projects` (redirect old `/projects`) **or** sidebar section “Executive” with Projects + Tasks children. |
| Tasks | Under Executive → Projects → Tasks path, or Executive → Tasks with clear copy that tasks belong to projects. Prefer `/executive/projects` + `/executive/tasks` (or keep pages, change nav labels/grouping). |
| Integrations | Move under **Product** — e.g. nav “Product” with child Integrations, or single item “Product / Integrations” → `/product/integrations` (redirect `/integrations`). |
| Active Agents / Agent Status | Must **not** appear (confirm absent). Do not reintroduce `/agents` fleet UI in nav. |
| System information | Add Settings subsection or `/settings/system` (or Help) with boundary copy — see below |

**Do not** build full CRUD for all Collaboration/Environmental entities this iteration unless trivial stubs. Nav may include placeholder links that land on “coming soon” **only if** needed for IA demo; prefer not littering empty pages — 3D + remap + system info is enough.

### System information copy (required)

Short static content (Settings or dedicated page):

1. This app is **business Mission Control**, not Versa AGi agitop.  
2. **Agents** appear only as users with type `agent`. Agent operations live in agitop.  
3. **agitop Organization** may be disabled when using this product’s Organization model.  
4. Migrating data from agitop Organization into this product is a **future** path — not current scope.

---

## Files likely touched

- `src/lib/fixtures/business-graph.ts` (replace node/link model)  
- `src/components/r3f/mission-control-scene.tsx` (layout, billboards, lightbox hook-in)  
- Dashboard (or host page) for expand/lightbox chrome  
- `src/components/shell/sidebar.tsx` (+ maybe routes under `src/app/`)  
- `src/lib/theme.ts` if zone colors needed  
- Optional: thin redirects for old paths  
- `package.json` version bump if you follow prior iteration pattern (e.g. toward 0.6.x / 0.7.0 — match existing convention)  
- `docs/api/API_CONTRACT.md` only if you add routes (not required for fixture-only graph)

---

## Out of scope (I5.5)

- I7 org hierarchy tree UI  
- Own SQL database  
- Full entity CRUD for Vendor/Customer/etc.  
- Map integration for Locations  
- agitop migration tooling  
- Public Northstar full rebrand  
- Expanding deprecated `/api/agents` fleet semantics  
- Opening I7 or inventing new zones beyond keystone  

---

## Acceptance criteria

1. [ ] Authenticated Mission Control 3D shows **keystone zones/nodes** (not Sales/Accounting/Local Team/Dashboards graph).  
2. [ ] Organization departments render as **spheres**; positions roughly match keystone intent.  
3. [ ] **Versa AGi** brand treatment + **Organization** rim label present.  
4. [ ] **Billboard** labels face camera.  
5. [ ] **Expand → lightbox** works (near fullscreen overlay, not browser fullscreen API).  
6. [ ] Dark + light both look correct.  
7. [ ] Sidebar: Projects/Tasks grouped under **Executive** path; Integrations under **Product** path; no agent fleet nav.  
8. [ ] System information boundary copy present.  
9. [ ] `npm run build` succeeds; COA can smoke on :3100/:3101 style local run if you document the port.  
10. [ ] Commit on `agent/web-dev` with clear message; notify COA for review (do not merge beta yourself unless that’s your established pattern — COA usually merges after smoke).  
11. [ ] No I7 scope creep.

---

## Handoff protocol

1. Work on `agent/web-dev` (sync from latest `beta` first: includes keystone docs `c721635`).  
2. Implement; self-check acceptance list.  
3. Internal message COA with: commit SHA, what changed, how to run, any deviations.  
4. COA smokes, merges to beta, notifies Stephen.

---

## Reference commits

| Commit | Note |
|--------|------|
| `c721635` | Keystone v1.1 + doc audit on beta |
| `0bf3c58` | I5.4.1 ring/triangle polish |
| `a41a27e` / `15c2d4a` | I5.4 transitional graph (replace conceptually) |

---

*End of I5.5 handoff.*
