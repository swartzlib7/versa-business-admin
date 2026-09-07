# State: Firebase hosting (versa-agi.web.app)

> **Role:** Sole go-to for deploying Mission Control to Firebase.
> **Product:** versa-admin-system · Project #26

| Field | Value |
|-------|-------|
| **Feature** | Public + staff Mission Control on `https://versa-agi.web.app` |
| **Status** | Live on `https://versa-agi.web.app` with hosted Supabase Postgres |
| **Last verified** | 2026-09-06 — master 0.7.135 deployed; Supabase remigrated 0000–0012 + seed |
| **Primary config** | `firebase.json`, `.firebaserc` |
| **Deploy from** | This repo only (`versa-agi-mission`) |

---

## 1. Behavior / contract

1. **URL.** Live site is `https://versa-agi.web.app` (also `https://versa-agi.firebaseapp.com`). That hostname is a **Hosting site ID** (`versa-agi`) on Firebase project **`versavoice-s777`**, not a separate Firebase project.
2. **What runs.** Next.js App Router with SSR, `middleware.ts`, `/api` route handlers, and session cookies. Classic static Hosting (`public/` HTML) cannot serve this app.
3. **Deploy path.** Firebase Hosting **web frameworks** (`hosting.source` + `frameworksBackend`) so the existing site URL is used. Do not create a second App Hosting `*.hosted.app` URL unless we later split projects.
4. **Scope.** `firebase.json` sets `"site": "versa-agi"`. Deploys from this repo must not touch Hosting sites `versavoice-s777` (landing) or `versavoice` (Flutter web).
5. **Data.** Live site uses `DATA_SOURCE=postgres` against hosted Supabase (Drizzle + `postgres` driver). The dashboard “Next.js + supabase-js” starter (`docs/supabase/prompt.md`) is **not** the path — do not add `@supabase/supabase-js` / Auth middleware for this cutover. Schema/adapter: `state_db_cutover_checklist.md`. Not Firestore. Not the Versa AGi host DB.
6. **Monorepo.** VersaVoice `app/firebase.json` stays the landing + web-app deploy. Do not add Mission Control as a third target there.
7. **versavoice.ai `/versa-agi`.** Still the old static page. Redirect to `https://versa-agi.web.app` is a later VersaVoice Hosting change, not part of this deploy.
8. **Session cookie.** Must be named `__session`. Firebase Hosting strips every other cookie before Cloud Function `ssrversaagi` sees the request. `versa_session` made login appear to do nothing (API 200, then dashboard bounced to `/login`).

## 2. Current State

- Site `versa-agi` on `versavoice-s777` is serving this Next.js app via Hosting web frameworks + Cloud Function `ssrversaagi` (us-central1).
- Supabase project `etxwzbxsuvcfbpxwhhtq` (us-west-2 pooler): Drizzle migrate applied; seed wrote 1 org, 5 depts, 6 users, catalog, 5 projects, 5 tasks, 4 products, 5 integrations.
- Live `/api/health` reports `ok` / `0.7.70` with real DB latency (~466ms). `/api/users` requires login (expected).
- Connection lives in gitignored `.env.local` / `.env.production`. Parent `docs/supabase/` is gitignored.
- `master` and `main` are at 0.7.135 plus Firebase hosting / `__session` cookie. Next deploy applies Drizzle 0000–0012 on Supabase (overwrite allowed).

## 3. Target State

- `firebase deploy --only hosting` from this repo publishes Mission Control to `https://versa-agi.web.app`.
- Public `/` and staff `/login` work on that host.
- Staff login uses seeded users until real accounts replace them.

## 4. Backlog / Plan

| ID | Deliverable | Status |
|----|-------------|--------|
| FH-1 | `firebase.json` + `.firebaserc` for site `versa-agi` | done |
| FH-2 | First frameworks deploy to `versa-agi.web.app` | done |
| FH-3 | Push deploy config on an origin branch (when asked) | done (origin/main) |
| FH-4 | Redirect `versavoice.ai/versa-agi` → `versa-agi.web.app` | later (VersaVoice Hosting) |
| FH-5 | Hosted Postgres (Supabase) + Function env + migrate/seed | done |
| FH-6 | Session cookie `__session` so Hosting forwards login | done |

## 5. How to deploy

From this repo root, logged in as the Blaze account that owns `versavoice-s777`:

```bash
npx -y firebase-tools@latest experiments:enable webframeworks
npx -y firebase-tools@latest deploy --only hosting --project versavoice-s777
```

## 6. Hosted Postgres (how)

Firebase Hosting / Cloud Function `ssrversaagi` does **not** include a database. The app already speaks Postgres via Drizzle (`DATABASE_URL` + `DATA_SOURCE=postgres`). Local Postgres is the Vagrant box; production is a managed instance.

**Locked host:** Supabase Postgres. Cloud SQL on `versavoice-s777` is a same-GCP alternative only if we explicitly change that lock.

### Steps

1. Create a Supabase project (region near `us-central1`). Database name can stay `postgres`; app schema is applied by Drizzle.
2. Copy the **URI** connection string (pooler, port 6543, `sslmode=require`) into `DATABASE_URL`. Do not commit it. `.env*` is gitignored.
3. From this repo, apply schema and seed (one-time / idempotent):

```bash
export DATABASE_URL='postgresql://…'   # Supabase URI
npx drizzle-kit migrate
node scripts/seed.mjs
```

4. Give the live Cloud Function the same secrets (runtime, not git):

```
DATA_SOURCE=postgres
DATABASE_URL=<same URI>
```

   Set them on function `ssrversaagi` (codebase `firebase-frameworks-versa-agi`) in the Firebase/GCP console, or a local `.env` that the next `firebase deploy --only hosting` copies into `.firebase/versa-agi/functions/.env`. Confirm that file is never committed.
5. Redeploy hosting so the function restarts with the new env. Then `/api/health` should show a real `latencyMs` (not `0` fixture).
6. Login uses seeded users (`admin@example.com` / fixture password in `scripts/seed.mjs`) until real accounts replace them.

Supabase free/pro is enough for fixture-sized data. Do not point this at the Versa AGi host Organization DB.

## 7. Change log

| Date | Change |
|------|--------|
| 2026-09-05 | Discovered `versa-agi.web.app` is Hosting site on `versavoice-s777`. Added frameworks config. First deploy live (`ssrversaagi`). |
| 2026-09-05 | Recorded hosted Postgres path (Supabase + Function env). FH-5 planned. |
| 2026-09-05 | Connected via pooler (IPv4); migrate + seed; redeployed `ssrversaagi` with `DATA_SOURCE=postgres`. Did not adopt supabase-js starter from dashboard prompt. |
| 2026-09-05 | Login bounce: Hosting strips non-`__session` cookies. Renamed cookie; full navigation after login. |
| 2026-09-05 | Merged `origin/beta` (0.7.135) onto `main`; kept COA login challenge + `__session` / Hosting config. |
| 2026-09-06 | Fast-forwarded `master` to same tip; remigrated Supabase; deployed 0.7.135 to versa-agi.web.app. |
