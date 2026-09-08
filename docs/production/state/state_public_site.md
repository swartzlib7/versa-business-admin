# State: Public Site Wiring

> **Role:** Sole go-to for visitor homepage wiring against Versa - Business Admin.
> **Product:** Versa - Business Admin / Versa-BusinessAdmin
> **Doc home:** docs/production/state/
> **Map:** shape_business_admin.md

| Field | Value |
|-------|-------|
| **Feature** | Public site wiring + visitor chrome |
| **Status** | 🔧 **0.7.146** — Comet palettes cycle dust / ion / green coma / sodium |
| **Last verified against code** | 2026-09-07 |
| **Primary code** | `src/app/page.tsx`, `src/lib/public/site-content.ts`, `src/components/public/*`, `src/app/settings/page.tsx`, `src/components/settings/branding-panel.tsx`, `src/app/contact/page.tsx` |

---

## Collaboration

| Field | Value |
|-------|-------|
| **Mindset** | Building |
| **Pattern** | continuous |
| **qa_reviewer** | pu |
| **QA display name** | Stephen |

Notes: Punch-list on the `beta` working tree (0.7.103). I5.6.33 Gate 3 is **accepted**. **Do not start a new zone-chrome train until tasked** (I5.6.34 already shipped). Commit/PR only when Stephen asks.

---

## 1. Behavior / contract

### Wired (live when Demo is Off)

- **Header brand** — Settings → Branding.
- **Hero** — Settings → Branding → Brand headline/subhead. Defaults: `Agentic General infrastructure` and `- built to fulfill expectations -`. Logo is **420px desktop / 315px mobile** at scale 100% (Settings → Branding → Logo, ±25% per surface). **Translucency, glow, color, and spread are per logo** (menu / home / footer). Upload must be **512–1024 px** on both sides, max 500 KB. Headline is **one line** (`whitespace-nowrap` + clamp). Each homepage section is **full viewport** with a **768px floor** (`min-h-[max(100dvh,768px)]`). Cycle strip sits in the hero. A next-section chevron sits at the bottom of each section except Contact. Mouse scroll past **25%** of the distance to the next/previous section snaps to that section.
- **Cycle strip** — Settings → **Cycle Strip** (renamed from Public). Master on/off; up to 10 steps. Each cell (number, heading, description) has its own Yes/No and editable value. Default six: Observe → Plan → Communicate → Supervise → Produce → Serve numbered 01–06. **Must not wrap** (`flex-nowrap`). Hero copy is **not** on this tab (Branding → Brand).
- **Integrations** — live vendor org integration lines (`line_group=integrations`). Empty state when none. No I6 `integrations.ts` fixture as live data.
- **Operations** — Executive `executive_project` / `executive_task` only. **No I6 fixture fallback.**
- **Metrics** — Sidebar **Stats** menu (`/stats`), type `environment_stat`. Not an Environment zone tab. Card + in-system SVG sparkline. Scales: hour, day, week, month, year, custom. **Do not auto-seed** on homepage read (`ensureEnvironmentStatsSeeded` exists for later automation).
- **Knowledge** — Environment `knowledge` (`name`, `kind`, `summary`).
- **Contact** — Sidebar **Contact** menu (`/contact`): email, phone, address. Same fields on public contact + footer. Not a visitor intake form.

### Demo only (Demo On)

Polished **Sample**-marked fixtures: Facets, System Landscape, Integrations, Operations, Support, Metrics, Knowledge, About. These are **not** live records. Demo Off shows empty states for Facets and System Landscape when those Public Menu items are on; wired sections show live data or empty states.

This instance currently has **Demo Off** in `.data/site-settings.json`.

### Visitor chrome

- Constellation: full-viewport star field, flicker, cursor parallax, theme RGB via `rgba()`. No connecting lines. **Two variants** (Settings → **Sky Animation**, persisted `constellation_variant` + `constellation_density` + `constellation_zoom` + `constellation_effects` on site settings, fixture + postgres migrations 0009/0010/0011/0012): **Classic** — milky-way star band only, brand-tinted stars (original look). **Realistic** — natural star distribution with color-temperature tints and tapered diffraction glints on the brightest stars. No faded color-band overlay. **Density** 1×–10× is shared. Classic **5× is the original band** (1× sparse, 10× twice as rich). Realistic 1×–10× still scales the natural field and **compacts into the Classic milky-way band** at the high end. **Stars zoom** 25%–200% in 25% steps (25% is the wide night-sky look of browser zoom-out; 100% is the previous scale). **Shooting stars, satellites, asteroids, and comets** are separate layers: they do **not** inherit Stars zoom, and each has On/Off, its own 25%–200% zoom, and a **Frequency** slider (⅓× / ½× / 1× / 2× / 3×; 1× is the usual rate). Wait between appearances is `base / frequency`. Shooting-star 1× is ⅓ the previous rate (the old cadence is 3×). Defaults: shooting stars On, satellites On, asteroids Off, comets Off; all frequency 1×. **Asteroids** are the former tumbling-rock look (gold, ice blue, emerald, royal red, silver, alternating — dust matches the rock). **Comets** are a slow nucleus with a fading path shine; each pass cycles one of four real-sky palettes: **dust** (pale yellow / off-white), **ion** (blue CO⁺ tail), **green coma** (C₂ / CN, larger head, quieter tail), **sodium** (orange-yellow). Variant/density/Stars-zoom switch re-seeds the star field; effect zoom and frequency do not. Sky Animation is a normal scrolling Settings page. Old `?tab=branding&sub=sky` redirects to `?tab=sky`.
- Public theme cycle: **Dark (default) → Architect → Slate**. Light/Dusk stay on operator Mission Control. Keys: `versa-public-ui-theme` vs `versa-ui-theme`. Public and operator stores are independent; pathname selects which store to apply.
- Header links are **nowrap**. Desktop nav starts at `xl`; below that the hamburger menu is used so labels do not wrap. **Settings → Menu → Public** reorders and toggles live visitor links (Mission Control Facets, System Landscape, Integrations, Operations, Metrics, Knowledge, Contact, Glossary, Org Board). Off hides the link **and** disables the page (`/terms`, `/board` 404; homepage sections are not rendered). Demo-only homepage sections (Support, About) follow **Demo mode**, not Public Menu.
- Footer: **50% opacity** `bg-background/50` bar with backdrop blur; back-to-top chevron sits on the top edge (same control as next-section). Three columns — Mission Control links **split into two sub-columns under a spanning heading**, centered brand + slogan/tagline, Contact — **left and right columns are center-aligned**. Address segments on own lines. Footer hash-links follow the same Public Menu on/off list.
- **Branding controls persist.** Root layout must pass opacity, glow (incl. color/spread), scales, **per-logo surfaces**, sky variant, density, zoom, and **sky effects** into `BrandProvider`. Settings Branding hydrates from `GET /api/settings/branding` (not from stripped context defaults). File picker uses `FileField` (outline Choose file + muted filename + ghost Remove) — native file chrome is out of style. Upload hint (512–1024 px) stays visible after a file is chosen. Save keeps the current Settings tab (`?tab=branding&sub=logo` or `?tab=sky`).

### Persist

New public fields live on the fixture JSON sidecar (`.data/site-settings.json`). No Postgres migration in this slice.

---

## 2. Current State

### 2.1 Why
Stephen named live surfaces, then stayed in IDE and shaped the visitor face (constellation, lockup, footer, themes).

### 2.2 Behavior today vs contract
Matches §1 on beta `:3200` at **0.7.146**. WU-07 / WU-08 / WU-09 accepted by Stephen 2026-09-05. Comet palettes (WU-11) accepted 2026-09-07.

### 2.3 Code anchors
- Settings store: `src/lib/fixtures/site-settings.ts`
- Public helpers: `src/lib/public/site-content.ts`, `src/lib/public/site-types.ts`
- Settings → Branding: `src/components/settings/branding-panel.tsx` (Brand / Logo)
- Settings → Sky Animation: `src/app/settings/page.tsx` (`?tab=sky`) + same panel
- Settings → Cycle Strip: `src/components/settings/public-site-panel.tsx`
- Contact menu: `src/app/contact/page.tsx`
- Stats type: `environment_stat`, sidebar menu `/stats` (not Environment), `stat_scale` value set
- Constellation: `src/components/public/versa-constellation.tsx`
- Public themes: `src/components/shell/theme-provider.tsx` (`cyclePublicTheme`, `ensurePublicTheme`)
- Slogan/tagline: `src/lib/fixtures/business.ts`
- File picker: `src/components/ui/file-field.tsx` (UI Components → Inputs)

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
| WU-07 | Default Dark on public + operator; independent theme stores (public toggle must not change operator) | — | ✅ | ✅ | ✅ | 265 |
| WU-08 | Logo display + constellation variants + mobile scroll | WU-05 | ✅ | ✅ | ✅ | 267 |
| WU-09 | Branding sub-tabs; persist sliders/sky; glow color/spread; logo scales; sky density; Cycle Strip cells; Information toggle text left | WU-08 | ✅ | ✅ | ✅ | 268 |
| WU-10 | Public Menu + operator On/Off; hidden item also disables the route | — | ✅ | ⬜ | 🔧 | 275 |
| WU-11 | Comet colors: dust / ion / green coma / sodium, cycling | WU-05 | ✅ | ✅ | ✅ | 280 |

---

## 5. Results Feedback

| Date | Scenario | Result | Follow-up |
|------|----------|--------|-----------|
| 2026-09-02 | Stephen marked wire vs demo | Implemented; demo data must not stand in for live | Demo Off on this instance |
| 2026-09-02 | Halo rings | Removed milky-way radial glow; stars + flicker only | — |
| 2026-09-02 | Cycle wrap | `flex-nowrap` | — |
| 2026-09-02 | Slogan / logo / Mission Control badge | Two-line lockup; 350px logo; badge removed | — |
| 2026-09-05 | Theme decoupling | Cycle public Architect/Slate/Dark; operator theme in another tab/login stays on its own store. Pathname `/` vs `/login` reapplies the correct store. | Confirm visually on :3200 |
| 2026-09-05 | Branding persist + sky | Translucency/glow/sky sliders did not restore after save (layout dropped fields from BrandProvider). Fixed in 0.7.116; Branding hydrates from API. | Confirm sliders + Classic/Realistic radio after reload |
| 2026-09-05 | Per-logo + sky fill | **0.7.117:** menu/home/footer each have Translucency, Glow, Color, Spread, Size. Preview wells are equal (home-sized) with logos centered. Upload 512–1024 px both sides. Sky preview fills remaining viewport (min 448px, max 4096px). Realistic faded color bands removed. | Visual QA on :3200 |
| 2026-09-07 | Public + operator menus | **0.7.137 (WU-10):** Settings → Menu has Operator / Public. Off hides the link and 404s the route (Settings locked on). Homepage hash sections are not rendered when off. E2E 16/16 on :3200. | Stephen visual QA |
| 2026-09-07 | Comet palettes | **0.7.146 (WU-11):** Four cycling comet colors (dust / ion / green coma / sodium). | Stephen accepted 2026-09-07 |

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
| 2026-09-05 | Branding IA + persist | **0.7.116 (WU-09):** Branding sub-tabs Brand / Logo / Sky Animation. Hero copy moved to Brand. Public tab renamed **Cycle Strip** with per-cell Yes/No for number, heading, and description. Logo glow adds Color + Spread; menu/home/footer size sliders ±25% around current sizes; styled `FileField` (style guide). Sky: live preview, density 1×–10× compacting into milky-way, cooler full-viewport satellites, softer glints. Root layout now passes display fields into BrandProvider (the persist bug). Information toggles put On/Off text left of the knob. Stephen QA. |
| 2026-09-05 | Per-logo surfaces + sky fill | **0.7.117 (WU-09 follow-up):** Translucency / Glow / Color / Spread are per logo (menu, home, footer). Three equal 420px-tall preview wells; logos centered. Upload requires 512–1024 px on both sides (hint always visible). Sky Animation preview fills remaining viewport below the sub-tab strip (min 448px, max 4096px). Realistic galactic haze / faded color bands removed. Save keeps the current Branding sub-tab (`?tab=branding&sub=logo|sky`). Stephen QA. |
| 2026-09-05 | Sky zoom | **0.7.118:** Sky Animation **Zoom** 25%–200% in 25% steps. 25% matches the wide, tiny-star night sky of browser zoom-out. Persisted `constellation_zoom`. Stephen QA. |
| 2026-09-05 | Dark scrollbar | **0.7.119:** Page and inner scrollbars follow the theme (dark track/thumb on Dark, Architect, Slate). |
| 2026-09-05 | Sky Preview + clear sections | **0.7.120:** Settings Sky Animation **Preview** opens the current sky full screen (Esc/Close). Public sections are transparent (no alternating bands). Footer stays **50%** with blur; left/right columns center-aligned; Mission Control heading spans both link columns. |
| 2026-09-05 | Independent sky effects | **0.7.121:** Stars zoom no longer scales shooting stars or satellites. Shooting stars, satellites, and comets each have On/Off and their own 25%–200% zoom. Comets are a new optional layer (dust + ion tails). Persisted `constellation_effects`. |
| 2026-09-05 | Classic density + live effect zoom | **0.7.122:** Density slider is shared with Classic; **5× is the original Classic band**. Tuning shooting-star / satellite / comet zoom scales them in place (does not regenerate the sky). Milestone commit of 0.7.118–122. |
| 2026-09-05 | Comet redesign | **0.7.123:** Comet arcs across the viewport (no fade-out). Dust/ion particles trail behind and fade. Max one; 15–60s between passes. |
| 2026-09-05 | Comet pace + sparkle | **0.7.124:** Comet ~5× slower; trail particles smaller and twinklier. |
| 2026-09-05 | Distant comet | **0.7.125:** Rock-shaped nucleus with a flickering sunlit glow; round halo removed. Tail longer and narrower. |
| 2026-09-05 | Comet path + dust | **0.7.126:** Rock ~3× larger. Dust peels off and hangs/falls instead of following. Enters from left, right, or bottom and arcs to the opposite top. |
| 2026-09-05 | Dust no gravity | **0.7.127:** Comet dust no longer falls; it stays where it peels off. |
| 2026-09-05 | Sky effect frequency | **0.7.128:** Each of shooting stars, satellites, and comets has Frequency ⅓×–3× (1× center). Shooting stars at 1× are ⅓ as often as before; 3× restores the old rate. |
| 2026-09-05 | Sky Animation top tab | **0.7.129:** Sky Animation is a Settings top tab (`?tab=sky`), not a Branding sub-tab. Branding keeps Brand / Logo. `?tab=branding&sub=sky` still opens Sky Animation. Stephen accepted WU-07–09. |
| 2026-09-05 | Settings order + comet rock | **0.7.130:** Settings tabs Branding, Menu, Cycle Strip, Appearance, Modes, Sky Animation. Information renamed Modes. Comet nucleus is a ~20-vertex tumbling rock with faceted faces. |
| 2026-09-05 | Comet shine + tumble | **0.7.131:** Comet rock is shinier (sunward gleam) and tumbles ~2× faster. Stephen accepted; branding/sky train closed. |
| 2026-09-07 | Public + operator menus | **0.7.137 (WU-10):** Settings → Menu has Operator / Public sub-tabs. Each item has On/Off. Off hides the link and 404s the route (Settings locked on). Homepage sections follow Public Menu. E2E 16/16 on :3200. |
| 2026-09-07 | Sky + demo menu | **0.7.138:** Sky Animation page scrolls (preview no longer clips controls). Public Menu drops Demo-only items (Facets/Systems/Support/About) — Demo mode owns those sections. Current rock animation is **Asteroids** (gold / ice blue / emerald / royal red / silver). **Comets** are a slow long-tail icy body. |
| 2026-09-07 | Comet trail + asteroid dust | **0.7.139:** Asteroid dust matches the rock tint. Comet brown stick removed; white shine is a fading trail left behind the nucleus. |
| 2026-09-07 | Facets + System Landscape menu | **0.7.140:** Public Menu includes **Facets** (was labeled Mission Control Facets at the time) and **System Landscape** (renamed from Other Systems). On/Off controls the homepage section and header/footer. Support/About stay Demo-only. |
| 2026-09-07 | Product identity | **0.7.142:** Public Facets heading/nav and footer use **Facets** / **VBA**. Formal product name **Versa - Business Admin**. |
| 2026-09-07 | Comet palettes | **0.7.146:** Comets cycle dust (pale yellow), ion (blue), green coma, sodium (orange-yellow). Green coma is a larger head with a quieter tail. |
| 2026-09-08 | Sky Preview | **0.7.153:** fullscreen Preview overlay now truly fullscreen — the settings page spacing utility (space-y-4) leaked a 16px bottom margin onto the fixed inset-0 overlay, leaving a bottom strip of page content visible; fixed with m-0. Verified in-browser: overlay box == viewport (800/800), margin-bottom 0. Stephen-reported. |
