# Web-dev slice — Settings/Users polish (scoped)

**Assigned:** 2026-07-23  
**Branch base:** rebase/FF `agent/web-dev` onto **`origin/beta` @ `aaf5894`** (Mission Control **0.7.50**) before any commits.  
**Do not** start Phase 3 writes, 32c expansion, or open-ended roadmap work.

## Context

Stephen confirmed 2026-07-23:

- Settings is **acceptable for now** — defer deeper UX until more product progress.
- Users screen **looks good** — green light to move forward.
- Scoped UI handoff to web-dev is authorized; COA stays on gates + other tracks.

Preview he used: `:3100` fixture mode (0.7.50). Your Vagrant PG path remains yours when needed later.

## In scope (this slice only)

1. **Parity check** — After rebase to beta tip, smoke:
   - `/settings` tabs: Records Editor, Branding, Appearance (Architect), System
   - `/users` list + detail
   - Login fixture or PG path you already own
   - No regressions vs 0.7.50 chrome (zone-aligned page headers)
2. **Light polish only** (pick what is clearly broken or inconsistent — do not redesign):
   - Spacing/alignment inconsistencies between Settings tabs and Users list vs shared page header component
   - Obvious dark/Architect theme glitches on those two routes
   - Empty/loading/error states that look unfinished on Users or Settings
3. **Docs** — Short note in PR/commit body: what you touched + screenshots optional.

## Out of scope

- Phase 3 DB writes / new seed work  
- New Record Type Editor features / 32c  
- Hub/org-board 3D changes  
- Glossary restoration  
- Renaming product IA  
- Buffer, content lanes, or non-MC work  

## Done when

- Branch rebased on current beta  
- Build + lint clean  
- Settings + Users smoke pass  
- COA notified with commit SHAs on `agent/web-dev` (push if deploy key OK)  
- Stop and wait — no self-assign next slice  

## Refs

- Living WBS: `docs/coa/MISSION_CONTROL_WBS.md`  
- Prior wrap brief: `docs/handoff/web_dev_brief_i5_6_wrap.md`  
- App version target: **0.7.50** line (`aaf5894` and any fast-forwards COA lands on beta)
