# State: migrate_agi_org

> **Role:** Sole go-to for host Versa AGi Organization → Versa - Business Admin migrate.
> **Product:** Versa-BusinessAdmin (Versa - Business Admin / VBA) · Project #26 · Game #109
> **Doc home:** docs/production/state/
> **Map:** shape_business_admin.md

| Field | Value |
|-------|-------|
| **Feature** | `migrate_agi_org` |
| **Status** | 0.7.149 — extra own Wave businesses are Orgs, not Branch |
| **Last verified against code** | 2026-09-08 (package `0.7.149`) |
| **Primary code** | `scripts/migrate_agi_org.mjs` |
| **Manual** | `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md` §2.10 |
| **Source schema** | `/var/lib/versa-agi/organization.db` via `agictl organization` |
| **Record-type ERD** | `docs/coa/RECORD_TYPE_FIELD_INVENTORY.erd.md` |

## 1. Behavior / contract

1. Read host Organization through `agictl organization` (not by sharing SQLite with VBA). Money on the host is **integer cents**; VBA currency fields are decimal strings (`/100`, never SUM across currencies).
2. **Primary Org is chosen from the source**, not guessed. `--primary-source-org-id` (id, slug, `external_id`, or name) is required for `--apply`. That source org is **merged onto** VBA’s existing Primary Org (`internal` + `is_primary`) — never a second Primary. Other own Wave businesses (C3D / Duende / Personal except the one selected) → additional **Orgs** (`org_type=internal`, not `is_primary`). They are not Collaboration Branch. Branch stays for actual subsidiaries. Wave Accounting → `vendor`. Host `vendor` → `vendor`. Wave customers / other `business` → `customer`.
3. **Writes every AGi entity that has a VBA home**, including `vendor_credential.configuration` (IMAP/API secrets). The report never prints configuration.
4. **Post-process / merge:** if VBA already has production data that this migrate did not create, the agent team must merge (match `external_id`, then reconcile VBA-only rows). `post_process.check` on dry-run and apply says whether that is the case. Idempotent re-apply skips ids that already migrated.
5. `--disable-host-org` is refused unless the Primary User has asked. After a **verified** migrate, disable agitop Organization so both catalogs do not own the same parties — only when the PU asks.
6. Fixture-mode apply is in-memory until `next start` restarts.

### Auth credential concerns (accepted, with mitigations)

| Concern | What we do |
|---------|------------|
| Secrets in transit | Copy only over the VBA HTTP session (review host is localhost). Never log or put `configuration` in the migrate JSON. |
| Storage | Catalog field is `long_text` — **not a vault**. Admins see it in Collaboration → Credentials. A vault/encrypt-at-rest is a later hardening, not a reason to leave auth behind. |
| Fixture restart | In-memory fixture drops rows (including secrets) on `next start`. Re-apply, or use Postgres for a durable cutover. |
| Host Org still on | This development host keeps Organization on. Production cutover: verify VBA auth works, then disable host Org. |
| Rotate | After a non-localhost cutover, rotate IMAP app passwords if the pipe was not trusted. |

Picklists are VBA value sets, not migrated rows.

## 2. Current state

0.7.149 writers copy credentials, require a source Primary Org, and map extra own Wave businesses as Orgs. Host-org disable remains refused here.

## 3. Backlog

| ID | Item | Status |
|----|------|--------|
| MIG-1 | Org party mapping + integration inventory | **done** |
| MIG-2 | Apply orgs to review `:3200` | **done** |
| MIG-3 | production_product | **done** |
| MIG-4 | treasury invoices/estimates + lines | **done** |
| MIG-5 | vendor_credential + vendor_integration (configuration copied 0.7.148) | **done** |
| MIG-6 | Disable host Organization on remote production cutover | deferred — PU-gated |
| MIG-7 | Encrypt credential configuration at rest (vault) | deferred — copy is plaintext long_text |
| MIG-8 | `--primary-source-org-id` + merge check for agent team | **done 0.7.148** |
| MIG-9 | Extra own Wave businesses are Orgs, not Branch | **done 0.7.149** |

## 4. Results Feedback

| Date | Result |
|------|--------|
| 2026-09-07 | Org-only apply (0.7.145). |
| 2026-09-07 | Full-entity apply without secrets (0.7.147). |
| 2026-09-08 | 0.7.149: extra own Wave businesses are Orgs. Review apply `--primary-source-org-id 8`: 3 internal (Duende Lunar LLC Primary; C3D Studio + Personal as Orgs), 0 branch, 2 vendor, 31 customer. |

## 5. Change Log

| Date | Change |
|------|--------|
| 2026-09-07 | Extracted. 0.7.145 org-only. |
| 2026-09-07 | 0.7.147 full-entity; secrets not copied. |
| 2026-09-07 | 0.7.148 credential configuration copied; `--primary-source-org-id` required; post-process merge check. |
| 2026-09-08 | 0.7.149: extra own Wave businesses → Orgs (`internal`), not Branch. One Primary (`is_primary`). |
