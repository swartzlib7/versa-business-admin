# Mission Control — remaining work (high level)

**Date:** 2026-09-04 (updated after Stephen 0.7.109 review)
**Product:** versa-admin-system · Project #26
**Map:** docs/production/state/shape_mission_control.md

You are tracking correctly on **core database work**. The fixture → Postgres cutover for first-class tables (users, organization, projects, tasks, products, integrations, seed, reads, writes) is **done**. There is not another Users/Projects schema train sitting unfinished.

**Validation note (2026-09-03):** every row below was checked against the codebase (beta working tree, commit 3ec28da + uncommitted punch-list). One correction found — the Catalog persistence row, now split to reflect what actually persists today. All other rows verified accurate as written.

What is still open:

| Area | Status | What it involves |
|------|--------|------------------|
| **Core DB / entity schema** | Done | No further cutover unless you reopen it. Verified: users, organizations, projects, tasks, products, integrations all read and write Postgres (drizzle adapter). Empty Postgres tables stay empty — leftover facet lists no longer inject fixture sample rows. |
| **Catalog persistence — record types** | Done (verified) | Record types DO persist: the system type registry is mirrored into the record_type table on first use, and custom record types register there lazily on first record write. Custom types also land in the durable overlay. |
| **Catalog persistence — fields, layouts, value sets** | Done (0.7.105) | Custom field definitions, saved layouts, and value sets persist via durable overlay (`.data/catalog.json`; `catalog_overlay` table when Postgres is on). System seed stays in code; overlay merges on boot (system fields are hidden, never deleted). |
| **Upgrade / overlay** | D1 + seed-pack stamp in 0.7.106 | New custom fields/types require `c_` plus lowercase letters, digits, and underscores (e.g. `c_due_date`). Overlay stamps `seed_pack` after merge-on-boot. Still open: org-scoped catalog (D3) and agent packages (D5). Not a multi-tenant login model — D3 is catalog scope under the Primary Org. |
| **Sample data** | Planned | Do **not** swap the live backend onto fixtures when Demo is on. Plan: global `external_id` on tables + **Insert Sample Data** / **Delete Sample Data**. Operator tables stay empty unless you create rows or insert tagged samples. Public Demo copy can stay fixture-only for the visitor site. |
| **Public site UI** | Milestone **0.7.109** | Full-viewport sections (768px floor), next-section chevron, 25% snap scroll, nowrap header. |
| **Operator chrome UI** | Milestone **0.7.109** | Zone/Statistics tabs match other pages; Contacts and UI Components use the shared content-card shading. |
| **Users UI** | In place | Admin Users surface exists (human / agent). No known missing Users module. |
| **Organization hierarchy UI (I7)** | Closed | Do not start until you open it. Primary Org is the one Org-type record; collaboration parties are relationships. |
| **Environment surfaces** | Thinner than org / collab | Locations, events, knowledge, schedules deferred as first-class lists. Later ERD: locations↔events, locations↔knowledge, events↔schedules, events↔knowledge; events/knowledge/locations have orgs. |
| **Receipts** | Named only | Customer analog of vendor Integrations. Do not build a tab until tasked. |
| **Packaging / install** | Not started | LAN or remote server — same install. API + catalog persist first; skill and ops-manual TBDs wait on that. |
| **Ops manual + agent skill** | Outline only | Manual drafted; skill not authored. Waits on API completion + packaging. |
| **Production cutover** | Started (login harden) | Proof-of-work login challenge + System toggle to hide public Sign In. Captcha is on. Remote business host still needs packaging/domain later. No production config in the repo yet. |

**Not product gaps:** uncommitted working-tree punch-list; do not start a new I5 train until tasked.
