# State: migrate_agi_org

> **Role:** Sole go-to for host Versa AGi Organization → Versa - Business Admin migrate.
> **Product:** Versa-BusinessAdmin (Versa - Business Admin / VBA) · Project #26 · Game #109
> **Doc home:** docs/production/state/
> **Map:** shape_business_admin.md

| Field | Value |
|-------|-------|
| **Feature** | `migrate_agi_org` |
| **Status** | 0.7.145 org mapping dry-run/apply; products/treasury/host-disable deferred |
| **Last verified against code** | 2026-09-07 (package `0.7.145`) |
| **Primary code** | `scripts/migrate_agi_org.mjs` |
| **Manual** | `docs/ops/BUSINESS_ADMIN_OPS_MANUAL.md` §2.10 |

## 1. Behavior / contract

1. Read host Organization through `agictl organization` (not by copying credential secrets).
2. Map parties into VBA `organizations`:
   - One VBA **Primary Org** (`internal`) already exists — never create a second.
   - Own Wave businesses (C3D Studio, Duende Lunar LLC, Personal) → `branch` under Primary Org.
   - Wave Accounting (`type=accounting`) → `vendor` tagged `integration_kind=wave_accounting`.
   - Host `vendor` → `vendor`; Wave customers / other `business` → `customer`.
   - Idempotent keys: `data.external_id`, `data.agi_org_id`.
3. **This pass does not write** production products, treasury invoices/estimates/transactions, or credential configuration.
4. **Integrations to turn off on a production cutover** (identify now, do not execute on this development host):
   - Wave Accounting sync into host org store — port as a VBA vendor_integration; Wave MCP stays, target becomes VBA.
   - Organization-stored IMAP credentials — optional later as `vendor_credential`; do not copy secrets; host email may keep them.
5. `--disable-host-org` is refused here. This host is the VBA **development** instance; host Organization is live. Disable agitop Organization only after VBA is system of record on the **remote production** instance.
6. Fixture-mode apply is in-memory until `next start` restarts.

## 2. Current state

Dry-run and `--apply` to `:3200` shipped 0.7.145. Productions skipped (Stephen: we do not have productions as a VBA migrate target this pass; host still has Wave products).

## 3. Backlog

| ID | Item | Status |
|----|------|--------|
| MIG-1 | Org party mapping + integration inventory | **done 2026-09-07** |
| MIG-2 | Apply orgs to review `:3200` | **done 2026-09-07** (fixture in-memory) |
| MIG-3 | production_product from host products | deferred |
| MIG-4 | treasury_transaction from invoices/estimates | deferred |
| MIG-5 | vendor_integration + vendor_credential records (no secret copy until vault) | deferred |
| MIG-6 | Disable host Organization on remote production cutover | deferred — PU-gated |

## 4. Results Feedback

| Date | Result |
|------|--------|
| 2026-09-07 | Script authored. Dry-run against this host Org. `--disable-host-org` refused. |
| 2026-09-07 | Apply to `:3200`: 36 orgs (2 vendor, 3 branch, 31 customer) onto Primary Org. Fixture in-memory. Products/treasury not written. |

## 5. Change Log

| Date | Change |
|------|--------|
| 2026-09-07 | Extracted. 0.7.145 dry-run/apply orgs; integrations identified not executed. |
