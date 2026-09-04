# COA brief — public site punch-list (0.7.103)

**To:** web-dev  
**From:** COA (Versa) + Stephen, IDE session 2026-09-02  
**Type:** FYI / orientation — **not a new I5 train, not an implementation ask**

## Do not invent work

- Gate 3 on **I5.6.33** is still waiting on Stephen. Do not start I5.6.34+ or a new train.
- This punch-list is on **COA’s `beta` working tree**, versions **0.7.91 → 0.7.103**, **uncommitted**. Do not overwrite it, do not “help” by implementing a parallel public site, and do not commit/PR unless COA asks after Stephen wants hygiene.

Living contract: `docs/design/spec/state/state_public_site.md` (same working tree).

## What shipped (far more than the original review marks)

Stephen named the live surfaces, then stayed in IDE and shaped the visitor face.

### Operator / data

- Settings → **Public**: hero headline/subhead, cycle master + up to 10 steps (each enable/disable).
- Sidebar **Contact** (`/contact`): email, phone, address. Not visitor intake.
- Sidebar **Stats** menu (`/stats`): type `environment_stat`, parent `stats`, `stat_scale` picklist (hour/day/week/month/year/custom), sparkline on the public card. **Not** an Environment zone tab.
- Persist: fixture JSON sidecar `.data/site-settings.json` (preserve the existing logo data URL). No Postgres migration in this slice.

### Live vs demo (Stephen’s later rule)

- **Demo On:** polished **Sample**-marked fixtures for Facets, Other Systems, Integrations, Operations, Support, Metrics, Knowledge, About. Must look good. Must **not** be treated as live records.
- **Demo Off:** live integrations (vendor org `line_group=integrations`), operations (**executive instances only**, no I6 fallback), stats (**do not auto-seed on homepage read**), knowledge. Empty states are OK.
- This COA instance currently has **`demo_mode: false`**.

Stay demo-only even when Demo is On as *samples*, never as wired sources: Facets, Other Systems, Support, About, Staff API, Products API.

### Visitor chrome (the extra work)

- Constellation: full viewport (`h-svh` / `window.innerHeight`). Dense milky-way **star band only** — **no halo rings / radial glow**. ~40–48% flicker. Shooting stars + cursor parallax. Theme colors via resolved RGB `rgba()`. rAF always scheduled; no connecting lines; no `color-mix`/`oklch` canvas gradients.
- Public themes only: **Architect (default) → Slate → Dark**. Light and Dusk stay on Mission Control. Separate storage key `versa-public-ui-theme`. Root init coerces `/` to those three.
- Hero lockup: **350px** brand logo immediately above the two-line slogan. **No** “Mission Control” badge. Headline one line (`whitespace-nowrap` + clamp).
- Slogan (from business fixture unless Settings → Public overrides):
  - `Agentic General infrastructure` (must stay one line)
  - `- built to fulfill expectations -` (smaller)
- Same pair in the footer under the brand.
- Footer: three columns — Mission Control links **split into two inner columns**, centered brand (150px logo + name + slogan), Contact right-aligned with address segments on own lines (city+state rejoined). Copyright left under a divider.

## Code anchors (COA tree)

- `src/app/page.tsx` — homepage demo/live split + hero
- `src/lib/fixtures/site-settings.ts`, `src/lib/public/site-content.ts`, `src/lib/public/site-types.ts`
- `src/components/settings/public-site-panel.tsx`, `src/app/settings/page.tsx`
- `src/app/contact/page.tsx`
- `src/components/public/versa-constellation.tsx`, `public-footer.tsx`, `stat-spark.tsx`, `public-stats-grid.tsx`
- `src/components/shell/theme-provider.tsx` — `PUBLIC_THEMES`, `cyclePublicTheme`, `ensurePublicTheme`
- `src/lib/fixtures/business.ts` — slogan / tagline

## Later (only if COA asks)

1. Commit / PR hygiene so this punch-list does not collide with Gate 3 / I5 branch protocol.
2. Postgres path for the new public fields.
3. Stats automation seed (`ensureEnvironmentStatsSeeded` exists; homepage must not call it on read).
4. Visitor intake — out of scope unless Stephen asks.

## Beta

`http://localhost:3200` / `http://192.168.4.107:3200`, `DATA_SOURCE=fixture`. Footer/admin version is `NEXT_PUBLIC_APP_VERSION` from `package.json` (currently **0.7.103**).
