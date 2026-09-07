# Mission Control — remaining work (high level)

**Date:** 2026-09-07
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
| **Upgrade / overlay** | Done (0.7.132) | D1–D6: `c_` namespace, hide-not-delete, Primary-Org overlay, seed-only, agent packages API, branding parallel. |
| **Sample data** | Done (0.7.133–0.7.136) | Settings → Modes Insert/Delete Sample Data; rows tagged `mc_sample:`. Demo never swaps the live backend. Packaged DB ships empty. |
| **Public site UI** | Milestone **0.7.140** | Facets + System Landscape Public Menu; sky 0.7.139 accepted. |
| **Operator chrome UI** | Milestone **0.7.141** | Collapsible icon-only operator rail; Settings → API catalog. |
| **Users UI** | In place | Admin Users surface exists (human / agent). No known missing Users module. |
| **Organization hierarchy UI (I7)** | Closed | Do not start until you open it. Primary Org is the one Org-type record; collaboration parties are relationships. |
| **Environment surfaces** | Thinner than org / collab | Locations, events, knowledge, schedules deferred as first-class lists. Later ERD: locations↔events, locations↔knowledge, events↔schedules, events↔knowledge; events/knowledge/locations have orgs. |
| **Receipts** | Named only | Customer analog of vendor Integrations. Do not build a tab until tasked. |
| **Packaging / install** | Agent path done | Skill `mission_control` + manual §2.0 (clone, read manual, install, implement GET /api). Container/systemd still TBD. Versa AGi setup-enable prompt is the remaining host-installer slice. |
| **Ops manual + agent skill** | Done (2026-09-07) | Manual living; skill marked ready. |
| **Production cutover** | Started | Login harden on Firebase. AWS Lightsail + isolated Versa AGi instance decided; waiting the Ubuntu box (#272). |

**Not product gaps:** uncommitted working-tree punch-list; do not start a new I5 train until tasked.
