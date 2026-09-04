# State — Mission Control Upgradability

> **Doc home:** docs/production/state/
> **Map:** shape_mission_control.md

**Project:** #26 versa-admin-system (Versa AGi Mission)  
**Living doc:** yes — one fold for upgrade model  
**Status:** Overlay storage + D1 `c_` namespace + seed-pack stamp shipped 0.7.106. Remaining: org-scoped catalog (D3), agent packages (D5).  
**Related tasks:** #239 (design), #240 (ops manual + Mission Control skill).

---

## 1. Purpose

Define how Mission Control upgrades without destroying tenant configuration or data, and how agents/customers extend the product safely.

## 2. Three-layer model

| Layer | Owns | Mutability on upgrade |
|-------|------|------------------------|
| **System code** | Next.js app, typed cores, migrations shipped with the product | Replaced by release artifact |
| **Tenant config (catalog)** | Record types, fields, layouts, picklists, zone metadata, branding overlays | Merged via seed/patch rules; tenant customizations preserved |
| **Tenant data** | Record instances, attachments, business content | Never rewritten by product upgrade seeds |

Intent already visible in code: typed cores + catalog metadata + instance/JSONB data; `is_system` guards; generic zone catalog fetch. Gaps closed by this design: durable catalog (not session-only), upgrade seed contract, agent package surface.

## 3. Overlay / merge principles (recommendation)

1. **System seed** defines baseline catalog objects (api names, system fields, default layouts).
2. **Tenant overlay** stores customizations keyed by stable api names.
3. **Merge at read:** system baseline ∪ tenant overlay; tenant wins on non-protected attributes; system wins on protected system invariants.
4. **Hide, do not delete** system fields the tenant “removes” (D2).
5. **Namespaces** separate system vs custom identifiers (D1).
6. **Org-scoped schema** — catalog and data are scoped per organization/tenant (D3).
7. **v1 patches are seed-only** — no destructive auto-migrate of tenant rows (D4).
8. **Agent packages** land only after durable catalog exists (D5).
9. **Branding** (theme, logos, white-label) runs as a **parallel** overlay track, not blocked on catalog durability (D6).

## 4. Locked decisions D1–D6 (Stephen 2026-08-18)

| ID | Decision | Locked choice |
|----|----------|---------------|
| **D1** | Custom field / type namespace | **`c_` prefix** for customer/tenant-defined api names (system names remain unprefixed or product-owned) |
| **D2** | Removing system fields | **Hide-not-delete** — system fields stay in catalog; UI/API can hide; upgrades may re-surface required system fields |
| **D3** | Schema scope | **Org-scoped** catalog + data (multi-tenant safe; no global shared mutable catalog) |
| **D4** | Patch / upgrade mechanism v1 | **Seed-only** — ship additive/updated system seeds; no automatic destructive rewrite of tenant instance data |
| **D5** | Agent extension surface | **After durable catalog** — agent packages (installable catalog+code bundles) sequenced after catalog is durable (not session Map) |
| **D6** | Branding / white-label | **Parallel track** — may proceed without waiting on full agent-package model |

## 5. Durable catalog cutover (sequencing gate)

**Current gap:** closed 2026-09-03 (0.7.105). Fields, layouts, value sets, custom record types, and saved layout configs persist via `.data/catalog.json` (and `catalog_overlay` when `DATA_SOURCE=postgres`). Runtime merge is seed ∪ overlay; system fields are hidden, not deleted.

**Before remaining overlay work (D1 / D4 runner / D5 packages):**

1. ~~Durable catalog store~~ **done**
2. Cutover rule: fixtures → durable seed on first boot; thereafter seeds merge, never clobber tenant `c_*` and overlays. **merge-on-boot is in; `c_` enforced on new custom fields/types; overlay stamps `seed_pack`.**
3. Runtime all zone forms/listings read merged catalog + saved layouts.
4. Then: seed pack versioning + upgrade runner (seed-only v1). **v1 runner: boot resets to current seed, reapplies overlay, stamps `seed_pack`.**
5. Then: agent package sketch (manifest, permissions, install path).

## 6. Agent package sketch (post-durable catalog)

- Manifest: package id, version, required MC version, catalog seeds (`c_` or partner namespace TBD), optional UI/route contributions.
- Install = seed merge + enable flag; uninstall = disable/hide, not hard-delete tenant data written while package was active.
- No host agitop agent-fleet chrome inside Mission Control (product boundary unchanged).

## 7. Non-goals (v1)

- Live multi-master catalog sync across hosts
- Automatic rewrite of tenant JSONB instance shapes on every release
- Implementing overlay code before Gate 3 + durable catalog plan
- Conflating agitop host upgrades with Mission Control product upgrades

## 8. Ops manual linkage

Implementer-facing procedures live in `docs/ops/MISSION_CONTROL_OPS_MANUAL.md` (Task #240). That manual must not invent upgrade runbooks that contradict **seed-only v1** or D1–D6.

## 9. Change log

| Date | Change |
|------|--------|
| 2026-08-17 | Initial recommendation + D1–D6 defaults drafted for Stephen review |
| 2026-08-18 | D1–D6 **locked** by Stephen; ops manual required as separate deliverable |
| 2026-08-19 | Doc restored/rewritten on disk from locked decisions (file had been missing from workspace tree) |
| 2026-09-03 | Restored onto this working tree with the ops-manual outline. I5.6.33 Gate 3 accepted; remaining implementation gate is durable catalog. |
| 2026-09-03 | Durable catalog overlay shipped (0.7.105): fields/layouts/value sets persist; system seed ∪ overlay merge. Overlay runner / `c_` namespace still open. |
| 2026-09-03 | 0.7.106: D1 `c_` required on new custom fields and record types; overlay `seed_pack` stamp (seed-only v1 runner). |

---

## 10. Locked decision block (machine-readable summary)

```
D1=c_namespace
D2=hide_not_delete_system_fields
D3=org_scoped_schema
D4=seed_only_v1_patches
D5=agent_packages_after_durable_catalog
D6=branding_parallel
implementation=d1_c_namespace_and_seed_pack_stamp_0.7.106
remaining=org_scoped_d3,agent_packages_d5
```
