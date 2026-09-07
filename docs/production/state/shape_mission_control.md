# Shape: Mission Control (Versa AGi Mission)

> **Role:** Live map — open this first. Not a feature tracker.
> **Product:** versa-admin-system · Project **#26** · Game **#109**
> **Doc home:** docs/production/state/
> **Archive:** docs/production/state/__archive/

## How to use

1. Find the unit below.
2. Extracted → open that `state_*.md`.
3. Not extracted and in session → production_statefold Extract a unit.
4. Do not pre-create empty states for deferred rows.
5. Official overviews (product spec, production plan, ops manual) stay where they are — they are not feature trackers.

## Shared platform facts

- Standalone **business** Mission Control. **Not agitop.** Agents are a user type only.
- Stack: Next.js App Router, R3F, Tailwind/shadcn, TypeScript. HTTP API + Script Tasks only (no shared host DB).
- Upgrade model **D1–D6 locked** (`state_upgradability.md`): `c_` namespace, hide-not-delete system fields, org-scoped catalog, **seed-only v1**, agent packages after durable catalog, branding parallel.
- Review host: **:3200**. Fixture login is host-local. Rebuild + hard-reload after `next start`.
- Do not start **I5.6.34+** until Stephen tasks it.

## Official overviews (not units)

| Doc | Role |
|-----|------|
| `docs/coa/MISSION_CONTROL_PRODUCTION_PLAN.md` | Horizons / roadmap (Horizon 3 includes Mission Control skill) |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Product essence, spine, non-goals |
| `docs/ops/MISSION_CONTROL_OPS_MANUAL.md` | Setup / maintain / upgrade outline |
| `docs/ops/STALE_UI_AND_DEPLOY.md` | Stale `.next` / cache never-again |
| `docs/GIT_WORKFLOW.md` | Branch model (`agent/*` → `beta` → `master`) |

## Units

| Unit | Harvest source | State | Status |
|------|----------------|-------|--------|
| zone_erd | Keystone + zone ERD + baseline + zone-config + I5.6.33 proposal | `state_i5_6_zone_erd.md` | extracted |
| layout_ui | Layout proposal + chrome punch-list | `state_layout_mission_ui.md` | extracted |
| records_editor | I5.6.32c + Records Editor briefs | `state_records_editor_ux.md` | extracted |
| api_contract | `docs/api/API_CONTRACT.md` | `state_api_contract.md` | extracted |
| db_cutover | Fixture → Postgres checklist | `state_db_cutover_checklist.md` | extracted |
| zone_pages_live | I5.6.32 Slice 1 residual (baked tabs) | `state_zone_pages_live_records.md` | extracted |
| public_site | Public homepage / visitor chrome | `state_public_site.md` | extracted |
| upgradability | D1–D6 upgrade model | `state_upgradability.md` | extracted |

## Deferred / not built

| Unit | Why it has no state file yet |
|------|------------------------------|
| I7 org hierarchy UI | Closed until Stephen explicitly opens |
| Overlay implementation | Storage + D1 `c_` + seed-pack stamp in 0.7.106; Primary Org (not multi-tenant login) in 0.7.107; D3 org-scope and D5 packages still open (#239) |
| Agent packages (D5) | After durable catalog |
| Customer packaging / install | Horizon 3 — agent path is skill `mission_control` + manual §2.0; container/systemd still TBD |
| Mission Control skill | Authored and marked ready 2026-09-07 — `.agent/skills/mission_control.md` |

## At a glance (2026-09-03)

| Track | Now | Living state |
|-------|-----|--------------|
| Hub / zones / ERD | I5.6.33 Gate 3 **accepted** | `state_i5_6_zone_erd.md` |
| Page chrome / menu | 0.7.109 zone tabs match PageHeader height; Contacts/UI Components share card shading | `state_layout_mission_ui.md` |
| Records Editor | Train accepted with I5.6.33 | `state_records_editor_ux.md` |
| Public site | 0.7.109 full-viewport sections, 25% snap, nowrap header | `state_public_site.md` |
| API | 0.7.141 catalog + Settings → API; System Landscape alias | `state_api_contract.md` |
| DB cutover | Phase 0–4 done; fixtures still default on many boards | `state_db_cutover_checklist.md` |
| Upgrades | Overlay storage + D1 `c_` + seed-pack stamp in 0.7.106; D3/D5 still open | `state_upgradability.md` |

## Folded this cycle (2026-09-03)

Parallel specs, stale plans, and historical briefs moved to `__archive/`. Old paths left as stubs. See `__archive/README.md`.
