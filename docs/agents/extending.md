# Designing a change to Versa - Business Admin

**Audience:** an agent asked to plan, design or write a brief for a new VBA capability or a change to an existing one (for example "design how two instances share records").
**Not this page:** using VBA over the API (the other recipes here), or installing and upgrading (Ops Manual).

This install is pull-only. Your output is a **proposal** for the Primary User. You do not change code in this checkout, and you do not try ideas out on a live database.

## 1. Find what is already decided

**First:** [capabilities.md](capabilities.md) lists everything VBA already does. If what you are asked to design is there, use it or extend it; don't design a second one.

VBA's design documents ship in this repo, so they are on disk next to the code. **Decisions in them are senior to your brief.** If your plan disagrees with one, say so and ask; do not work around it.

| Read | For |
|---|---|
| `docs/production/state/docs_manifest.md` | The list of design ("state") documents. Open the one for your area, and any it links to |
| `docs/specs/PRODUCT_SPECIFICATION.md` | Zones, record homes, product rules |
| `docs/production/Code and Design Patterns.md` | How things are built here |
| `docs/production/state/state_upgradability.md` | Upgrade rules D1–D6: seed-only upgrades, hide-not-delete, `c_` tenant fields |
| `docs/ops/RELEASE_NOTES.md` | What is live, version by version |
| `GET /api` | The routes this version has |

## 2. Use what exists before adding

- **When it ships, update [capabilities.md](capabilities.md)** in the same change, like the release notes: the type, field behaviour, route or action, its version and links. Move a "Not built yet" line out when it is built.

- **Record types first.** Look for a record type that already fits (`GET /api/catalog/record-types`, or `src/lib/fixtures/record-types.ts` and `catalog.ts`). Many exist with no engine yet. Example: Collaboration → Vendor already has Credentials, Integrations and Exchange.
- **A new table is the last resort.** New fields and value sets ship as catalog seed: the feature is built generically and the specific fields come pre-configured.
- **Lines before link tables.** A header-and-lines record often holds the list a new table would.
- **Generic over special.** One capability that works for any record type beats a case for one type.

## 3. Where things plug in

| Concern | Where | Trap |
|---|---|---|
| Something must happen when a record is saved or deleted | The save pipeline, `src/lib/records/pipeline.ts` (`afterRecordWrite`, `afterRecordDelete`) | Not `src/lib/db/records-store.ts`: the store sits below the pipeline and is also used by demo install and the site pack |
| Statistics graph lines | `src/lib/db/stat-lines-store.ts` | Lines are not records; they are keyed by (statistic, series, slot), and the date comes from the statistic's settings |
| Who is signed in | `src/lib/auth.ts`, `src/lib/session-token.ts` | Sessions are signed (1.0.17). Never read or build the cookie yourself |
| Which requests need a sign-in | `src/proxy.ts` | Some `/api` prefixes are refused without a cookie before the route runs. A route a machine calls must not sit under one |
| Machine access | Opt-in per route | Never let a token or key act as a full session for every route |
| Secrets | Fields marked `is_secret` | Never echo a secret in an API answer or a log |
| Records from another system | The `external_id` field | A record with one is integrated: VBA does not recalculate or convert it |
| Records VBA installs | `ba_sample:` (demo) and `ba_site:` (site pack) ids | Leave them out of anything that copies or sends records |
| The API list | `src/lib/api/inventory.ts` (served at `GET /api`) | A new route is added here too |

## 4. Check facts before you write them

- Every code fact gets a path you opened. Count; do not estimate ("63 route files", not "about 80").
- Comments go stale. Confirm against the code before you repeat one.
- A page that reads from `src/lib/fixtures` and not the database is a stub, not a feature.
- Look for older versions of the same idea (tables, pages, routes) and say what happens to them.

## 5. Write the brief

Use the shape of the state documents, so it can be folded into one:

1. **Why:** the need, in the Primary User's words.
2. **Decisions:** what the Primary User has said, with dates.
3. **What exists:** a table of pieces with paths, marked verified.
4. **Design:** the smallest design that does the job; nothing for cases nobody has asked for.
5. **Stages:** each with acceptance checks that can be run on a throwaway instance.
6. **Open decisions:** questions with your recommendation. Propose; let the Primary User decide.
7. **Which state document it belongs in.**

Common misses, from past briefs: the record types already in the catalog, the save pipeline as the hook, the request gate refusing a new route, secrets readable through the API, and what a change does to statistics fed from records.
