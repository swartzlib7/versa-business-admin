# State: Public Site Wiring

> **Role:** Sole go-to for visitor homepage wiring against Mission Control.
> **Product:** Mission Control / versa-admin-system
> **Doc home:** docs/production/state/
> **Map:** shape_mission_control.md

| Field | Value |
|-------|-------|
| **Feature** | Public site wiring + visitor chrome |
| **Status** | 🔧 **0.7.113** — logo display controls (translucency/glow) + mobile pull-down fix (WU-08) |
| **Last verified against code** | 2026-09-05 |
| **Primary code** | `src/app/page.tsx`, `src/lib/public/site-content.ts`, `src/components/public/*`, `src/app/settings/page.tsx`, `src/app/contact/page.tsx` |

---

## Collaboration

| Field | Value |
|-------|-------|
| **Mindset** | Building |
| **Pattern** | continuous |
| **qa_reviewer** | pu |
| **QA display name** | Stephen |

Notes: Punch-list on the `beta` working tree (0.7.103). I5.6.33 Gate 3 is **accepted**. **Do not start I5.6.34+ until tasked.** Commit/PR only when Stephen asks.

---

## 1. Behavior / contract

### Wired (live when Demo is Off)

- **Header brand** — Settings → Branding.
- **Hero** — Settings → Public headline/subhead. Defaults: `Agentic General infrastructure` and `- built to fulfill expectations -`. Logo is **420px desktop / 315px mobile** (25% smaller on mobile), immediately above the headline (no Mission Control badge). Logo **translucency** and **glow** are backend sliders (Settings → Branding, 0–100% with live preview) applied to the hero logo and all BrandMark surfaces. Headline is **one line** (`whitespace-nowrap` + clamp). Each homepage section is **full viewport** with a **768px floor** (`min-h-[max(100dvh,768px)]`). Cycle strip sits in the hero. A next-section chevron sits at the bottom of each section except Contact. Mouse scroll past **25%** of the distance to the next/previous section snaps to that section.
- **Cycle strip** — master on/off; up to 10 steps (title, desc, enabled). Default six: Observe → Plan → Communicate → Supervise → Produce → Serve. **Must not wrap** (`flex-nowrap`).
- **Integrations** — live vendor org integration lines (`line_group=integrations`). Empty state when none. No I6 `integrations.ts` fixture as live data.
- **Operations** — Executive `executive_project` / `executive_task` only. **No I6 fixture fallback.**
- **Metrics** — Sidebar **Stats** menu (`/stats`), type `environment_stat`. Not an Environment zone tab. Card + in-system SVG sparkline. Scales: hour, day, week, month, year, custom. **Do not auto-seed** on homepage read (`ensureEnvironmentStatsSeeded` exists for later automation).
- **Knowledge** — Environment `knowledge` (`name`, `kind`, `summary`).
- **Contact** — Sidebar **Contact** menu (`/contact`): email, phone, address. Same fields on public contact + footer. Not a visitor intake form.

### Demo only (Demo On)

Polished **Sample**-marked fixtures: Facets, Other Systems, Integrations, Operations, Support, Metrics, Knowledge, About. These are **not** live records. Demo Off hides them; wired sections show live data or empty states.

This instance currently has **Demo Off** in `.data/site-settings.json`.

### Visitor chrome

- Constellation: full-viewport star field, flicker, shooting stars, cursor parallax, theme RGB via `rgba()`. No connecting lines. **Two variants** (Settings → Branding → Sky Animation, persisted `constellation_variant` on site settings, fixture + postgres migration 0008): **Classic** — milky-way star band only (no halo/glow rings), brand-tinted stars (original look). **Realistic** — natural star distribution with color-temperature tints, faint galactic haze, diffraction glints on the brightest stars, and **intermittent satellites** (steady points with short trails, varying speeds, never more than 3 at once, long quiet gaps, fade in/out). Variant switch re-seeds the field client-side; effect keyed on variant.
- Public theme cycle: **Dark (default) → Architect → Slate**. Light/Dusk stay on operator Mission Control. Keys: `versa-public-ui-theme` vs `versa-ui-theme`. Public and operator stores are independent; pathname selects which store to apply.
- Header links are **nowrap**. Desktop nav starts at `xl`; below that the hamburger menu is used so labels do not wrap.
- Footer: **50% opacity** `bg-background/50` bar; back-to-top chevron sits on the top edge (same control as next-section). Three columns — Mission Control links **split into two sub-columns**, centered brand + slogan/tagline, Contact right-aligned with address segments on own lines.

### Persist

New public fields live on the fixture JSON sidecar (`.data/site-settings.json`). No Postgres migration in this slice.

---

## 2. Current State

### 2.1 Why
Stephen named live surfaces, then stayed in IDE and shaped the visitor face (constellation, lockup, footer, themes).

### 2.2 Behavior today vs contract
Matches §1 on beta `:3200` at **0.7.112** (theme stores decoupled). Visual QA of WU-07 still with Stephen.

### 2.3 Code anchors
- Settings store: `src/lib/fixtures/site-settings.ts`
- Public helpers: `src/lib/public/site-content.ts`, `src/lib/public/site-types.ts`
- Settings → Public: `src/components/settings/public-site-panel.tsx`
- Contact menu: `src/app/contact/page.tsx`
- Stats type: `environment_stat`, sidebar menu `/stats` (not Environment), `stat_scale` value set
- Constellation: `src/components/public/versa-constellation.tsx`
- Public themes: `src/components/shell/theme-provider.tsx` (`cyclePublicTheme`, `ensurePublicTheme`)
- Slogan/tagline: `src/lib/fixtures/business.ts`

---

## 3. Target State

Matches §1. Later (not this session): Stats automation seed; visitor intake out of scope; commit/merge of the punch-list after Stephen/web-dev hygiene (do not collide with Gate 3 / I5 branch protocol).

---

## 4. Backlog / Plan (WBS)

| ID | Deliverable | Depends | Agent verify | QA | Status | Task ID |
|----|-------------|---------|--------------|-----|--------|---------|
| WU-01 | Hero + cycle in Settings | — | ✅ | ✅ | ✅ | IDE |
| WU-02 | Wire homepage (demo vs live split) | WU-01 | ✅ | ✅ | ✅ | IDE |
| WU-03 | Contact menu + form | — | ✅ | ✅ | ✅ | IDE |
| WU-04 | Stats menu + type/sparkline (not Environment tab) | — | ✅ | ✅ | ✅ | IDE |
| WU-05 | Constellation + public themes + footer + hero lockup | WU-02 | ✅ | ✅ | ✅ | IDE |
| WU-06 | Commit / handoff hygiene with web-dev | WU-05 | ⬜ | ⬜ | ⬜ | |
| WU-07 | Default Dark on public + operator; independent theme stores (public toggle must not change operator) | — | ✅ | ⬜ | 🔧 | 265 |

---

## 5. Results Feedback

| Date | Scenario | Result | Follow-up |
|------|----------|--------|-----------|
| 2026-09-02 | Stephen marked wire vs demo | Implemented; demo data must not stand in for live | Demo Off on this instance |
| 2026-09-02 | Halo rings | Removed milky-way radial glow; stars + flicker only | — |
| 2026-09-02 | Cycle wrap | `flex-nowrap` | — |
| 2026-09-02 | Slogan / logo / Mission Control badge | Two-line lockup; 350px logo; badge removed | — |
| 2026-09-05 | Theme decoupling | Cycle public Architect/Slate/Dark; operator theme in another tab/login stays on its own store. Pathname `/` vs `/login` reapplies the correct store. | Confirm visually on :3200 |

---

## 6. Change Log

| Date | Change | Items |
|------|--------|-------|
| 2026-09-02 | Wire public site per Stephen marks | Hero, cycle (10), integrations, operations, stats, knowledge, contact menu |
| 2026-09-02 | Demo vs live | Demo samples Sample-marked; live has no I6 fallback / no auto-seed stats |
| 2026-09-02 | Visitor chrome | Full-viewport constellation, Architect/Slate/Dark, footer 3-col + MC two-col, slogan lockup, 350px hero logo |
| 2026-09-02 | Beta versions | 0.7.92 → **0.7.103** on `:3200` (uncommitted working tree) |
| 2026-09-02 | Stats IA | Moved off Environment zone onto sidebar **Stats** menu (`/stats`) |
| 2026-09-03 | Login / public chrome | Backend login “Open home page” in a new window; System toggle hides public Sign In; proof-of-work login challenge |
| 2026-09-05 | Themes | Public toggle wrote operator `versa-ui-theme`. **0.7.112:** `persistSurface` writes one key; pathname reapplies the matching store. Dark remains default on both. WU-07 agent-verified; Stephen QA. |
| 2026-09-05 | Logo display + mobile | **0.7.113 (WU-08):** mobile pull-down no longer reseeds the constellation (debounced resize); hero logo 25% smaller on mobile; Settings → Branding adds Logo Translucency + Logo Glow sliders (0–100%, live preview) driving hero + BrandMark. Stephen QA. |
| 2026-09-05 | Constellation variants + refresh | **0.7.115:** pull-to-refresh **re-enabled** on mobile/tablet (the 0.7.114 auto-scroll fix resolved the jumping on its own; overscroll block removed). Constellation **variants**: Classic (original band) vs **Realistic** (natural tints, galactic haze, diffraction glints, intermittent satellites — max 3 concurrent, varying speeds, fade in/out). Switch: Settings → Branding → Sky Animation; persisted `constellation_variant` (fixture JSON + postgres migration 0008). Stephen QA. |
| 2026-09-05 | Mobile scroll behaviour | **0.7.114 (WU-08 follow-up):** section snap-scroll disabled on mobile/tablet (<=1023px) - it fought the responsive layout on narrow screens; native pull-to-refresh + overscroll bounce disabled on narrow screens (overscroll-behavior-y), so pausing mid-swipe no longer jumps/refreshes the page. Desktop snap unchanged. Stephen QA. |
