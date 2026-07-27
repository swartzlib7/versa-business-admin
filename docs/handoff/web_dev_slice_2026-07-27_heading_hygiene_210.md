# Web-dev brief - I5.6.44 #210 Rings default 50% + heading hygiene (0.7.65)

**From:** COA (Versa)
**Source:** Stephen Gate 3 typed feedback int_6bbf5366d8024aa7 (2026-07-27 ~12:39 EDT)
**Base:** agent/web-dev @ a6c78b6 (0.7.64.1) - do NOT regress #207 forms focus / rings 5-step / (fixed)/(db) labels or #209 IA nav/sub-tabs
**Target version:** 0.7.65 (package.json + health route + sidebar footer via NEXT_PUBLIC_APP_VERSION)
**Three-gate:** implement -> COA Gate 2 on :3200 -> Stephen final visual PASS (he will re-check listed items only)

## Context

Stephen reviewed cumulative 0.7.64.1 on :3200 and said prior items All PASS.

Two polish asks before his final PASS:

1. Rings default -> 50% - once done, treat as PASS (no separate re-litigation of rings).
2. Sitewide heading hygiene - remove duplicate page/section titles that repeat the active sub-tab (or main tab) name. Keep the subtitle / description only under the sub-tab strip. Same pattern everywhere.

After this slice he will do one more final PASS on these listed items.

## A) Rings default 50%

**Files (known):**
- src/app/dashboard/page.tsx - useState initial "on" -> "50"
- src/components/r3f/mission-control-scene.tsx - internal default useState "on" -> "50"; update JSDoc that says default on

**Behavior:**
- First paint / no persisted override: rings show at 50%.
- Cycle order unchanged: On -> 50% -> 25% -> 10% -> Off -> On
- If any localStorage already persists rings mode, keep that preference; only change the initial default when nothing is stored.
- Label still shows Rings 50% when mode is 50.

## B) Heading hygiene - contract

### Rule (sitewide)

Under an active main tab or sub-tab, do NOT render a large heading / CardTitle / EntityListing title that repeats the tab label.

Keep:
- Subtitle / summary line under the strip (optional badge OK)
- Page-level PageHeader destination titles (Organization, Records Editor, Glossary, etc.)
- Table column headers, field labels, badge chips
- SubTabBar / SectionTabs labels themselves

Remove:
- CardTitle / h2 Configuration immediately under the Configuration sub-tab
- Duplicate Information title under Information sub-tab
- Panel heading that matches the main tab name (e.g. tab Policy must not open with heading Policy above the subtitle about governing policies)
- Glossary Entries derivative chrome like "Configuration . Zones" / stacked Configuration + section-name title noise
- EntityListing title=panel.label when that label is the active tab name - use summary only

### Canonical intent (Stephen examples)

1. Configuration under Configuration - Records Editor, Glossary, Users, Settings Branding/Appearance: sub-tab strip says Configuration; body must not open with another Configuration heading. Subtitle/description only (or bare content).
2. Organization / Executive / Policy - tab is Policy; content currently has heading Policy + subtitle about governing policies -> subtitle only.
3. Glossary / Entries - remove Configuration . Zones (or similar) derivative chrome; same hygiene as other Configuration panels.
4. Throughout site - same rule for Collaboration, Environment, Settings System/Information, Users, any other tabbed admin surface.

### Likely code touchpoints (verify in tree; not exhaustive)

- src/components/zones/zone-config-view.tsx - FormPanel CardTitle panel.label; ListingPanel -> EntityListing title=panel.label
- src/components/listing/entity-listing.tsx - optional title; allow summary-only header
- src/components/settings/records-editor.tsx - three CardTitle Configuration
- src/app/glossary/page.tsx - Configuration CardTitles + Entries derivative title
- src/app/settings/page.tsx - panel title prop under Configuration/Information
- src/app/users/page.tsx / users-panel - Configuration title
- Any other PageHeader/CardTitle that echoes the active SectionTabs / SubTabBar label

## C) Out of scope

- Beta merge (COA after Stephen final PASS)
- New features, Buffer, Interview, seed rewrite
- Changing tab structure from #209 (keep Types|Fields|Picklists + Configuration, etc.)
- Re-opening #207 form/rings step list (only default changes)

## D) Verify

1. npx tsc --noEmit + npm run build clean
2. Version 0.7.65 in package.json + /api/health
3. Smoke on :3200 (or note SHA for COA rebuild):
   - Dashboard: first load Rings 50% (no prior localStorage)
   - Records Editor Types/Fields/Picklists -> Configuration: no second Configuration heading
   - Glossary Sections + Entries -> Configuration: no duplicate Configuration; no Configuration . Zones style derivative
   - Users -> Configuration: no duplicate Configuration title
   - Settings Branding/Appearance -> Configuration; System -> Information: no duplicate titles
   - Organization (and spot-check Collaboration/Environment): open Policy (or any faculty tab) - subtitle only, no repeated tab-name heading
4. Push origin agent/web-dev + internal note to COA with SHA + short verify notes
5. Update docs/design/spec/state/state_records_editor_ux.md Behavior + Change Log for heading hygiene + rings default

## E) After Gate 2

COA re-Gate 2 -> Stephen final PASS on listed items -> beta merge of cumulative stack.
