# Web-dev brief — I5.6.43 #209 IA Configuration pattern (0.7.64)

**From:** COA (Versa)
**Source:** Stephen Gate 3 voice feedback kRfBiWcX8I1doALc2r31 (2026-07-27 ~11:29 EDT)
**Base:** agent/web-dev @ 872c74a (0.7.63) — do not regress forms focus, rings 5-step, or (fixed)/(db) labels
**Target version:** 0.7.64 (package.json + health route)
**Three-gate:** implement → COA Gate 2 on :3200 → Stephen visual

## Intent

Stephen wants one IA pattern everywhere:

1. Left nav = top-level destinations (zones + Glossary + Users + Records Editor + Settings).
2. Inside a destination: main section tabs (e.g. Sections | Entries, or Types | Fields | Picklists, or Branding | Appearance | System).
3. Under each main tab: a sub-tab that holds the actual UI — usually labeled Configuration (not a second copy of the parent tab name). Exception: System may use Information because content is mostly read-only status.

Canonical reference: Organization / Collaboration / Environment via ZoneConfigView (parent tabs + nested Configuration sub-tab first — I5.6.9 in zone-config-view.tsx).

## A) Left navigation (src/components/shell/sidebar.tsx)

Current (0.7.63): Dashboard, Organization, Collaboration, Environment, Glossary, Users→/settings?tab=users, Settings.

Change to:

- Dashboard /organization /collaboration /environment /glossary — unchanged
- Users → /users (own top-level item again — not Settings)
- Records Editor → own left-nav item (prefer new route /records-editor wrapping RecordsEditor; not a Settings tab)
- Settings → /settings (Branding / Appearance / System only)

Remove Users and Records Editor from Settings top tabs.
/settings?tab=users and /settings?tab=records must redirect to the new homes.
Keep /users as real Users chrome.

## B) Shared chrome pattern

Prefer SectionTabs for main tabs (labels only). Zone-style child/sub tabs for inner strip (ZoneConfigView Configuration row language).
Under active main tab, default sub-tab = Configuration (or Information for System).
Do not render a big panel title that repeats the main tab name (Branding tab must not open a card titled Branding again). Use Configuration / Information, or omit redundant CardTitle.

### B1. Glossary (src/app/glossary/page.tsx)
Main tabs: Sections | Entries.
- Sections → sub-tab Configuration → sections management UI (today block titled Sections — restructure).
- Entries → sub-tab Configuration → entries UI + picker.
Keep blue accent + left-align from #205.

### B2. Records Editor (top-level page; move out of Settings)
Main tabs: Types | Fields | Picklists.
Each gets sub-tab Configuration holding existing New + table + expand UI.
Fix duplicate tab-name chrome. Keep formatSampleLabel / plain inputs / #207 fixes.

### B3. Users (top-level /users)
Section Users → sub-tab Configuration → UsersPanel (New User + table).

### B4. Settings (remaining only)
Main tabs: Branding | Appearance | System only.
- Branding → Configuration (brand controls)
- Appearance → Configuration (theme grid)
- System → Information (not Configuration) — system info panel
Remove records + users from TABS and default tab logic.

## C) Out of scope
Beta merge of #205/#206/#207 (COA after cumulative Gate 3). Rings/hub/Buffer/Interview/seed rewrite. No new backend models.

## D) Verify
1. tsc --noEmit + npm run build clean
2. Version 0.7.64 in package.json + /api/health
3. Smoke: sidebar Users + Records Editor own items; Settings tabs only Branding/Appearance/System; Glossary/Records/Users Configuration sub-tabs; System Information; old query redirects
4. Push origin agent/web-dev + note COA with SHA

## E) State
Update docs/design/spec/state/state_records_editor_ux.md Behavior for IA + Change Log when shipping.
