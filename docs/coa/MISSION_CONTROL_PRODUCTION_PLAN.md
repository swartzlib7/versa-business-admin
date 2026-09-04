# Versa AGi — Mission Control: Production Plan & Roadmap

**Date:** September 3, 2026  
**Status:** Living Roadmap & Strategic Sequencer  
**Project:** Mission Control (Project #26) · Game #109  
**Executive Director:** Stephen Nortje  
**Orchestrator:** Versa (COA)

**Ops outline on this tree (for review):** `docs/ops/MISSION_CONTROL_OPS_MANUAL.md`  
**Feature map (open first):** `docs/production/state/shape_mission_control.md`  
**Upgrade model (D1–D6 locked):** `docs/production/state/state_upgradability.md`

---

## 1. Executive Summary & Current Milestone

With the completion and formal acceptance of the **Records Editor foundational suite (Slices J through O on commit `521f5e1`)**, the dynamic schema and configuration engine of Mission Control is fully operational on preview (:3200). Custom and built-in record types now support:
- Strict **Header** and **Lines** zone separation and placement.
- Zone-aware **Layout Editor** honoring sections and field groupings.
- Clean **View / Edit / Save-Cancel** state cycles across custom and built-in configuration tabs.
- Multi-column line visibility controls.

We are now ready to sequence the path toward **Full Production Release**.

---

## 2. Production Tracks & Architecture Status

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MISSION CONTROL MATURITY                         │
├─────────────────────────┬──────────────────────────┬────────────────────────┤
│ Track A: Dynamic Engine │ Track B: Data & Storage  │ Track C: Operations &  │
│        (COMPLETE)       │       (NEXT FOCUS)       │      Distribution      │
├─────────────────────────┼──────────────────────────┼────────────────────────┤
│ • Structure types       │ • Seed pipeline from PG  │ • Multi-tenant overlay │
│ • Zone Layout Engine    │ • Durable Postgres repo  │ • Packaging & dist     │
│ • Custom/Built-in tabs  │ • Live write mutations   │ • Manual + MC skill    │
│ • Table column control  │ • Multi-tenant schema    │ • Self-healing runtime │
└─────────────────────────┴──────────────────────────┴────────────────────────┘
```

---

## 3. Immediate Next Horizons (High-Priority Slices)

### Horizon 1: Durable Catalog Cutover (Phase 2 Data Architecture)
- **Objective:** Move beyond in-memory/session catalog state to persistent Postgres-backed schema storage using Drizzle ORM.
- **Deliverables:**
  1. Persistent entity and layout definitions in PostgreSQL (`catalog_schema`, `layout_definitions`).
  2. Data migration seed scripts loading baseline fixtures into PostgreSQL.
  3. Seamless API read/write routes reflecting saved custom types across system reboots.

### Horizon 2: Mission Control Upgradability & Multi-Tenancy (Task #239)
- **Objective:** Implement the locked 3-layer architecture (**System Code** / **Tenant Config** / **Tenant Data**).
- **Deliverables:**
  1. Overlay merge algorithm (`is_system` protection vs. tenant custom fields/layouts).
  2. Namespace protection (`c_` custom, `p_` platform prefixes).
  3. Non-destructive patch and migration runner for tenant upgrades.

### Horizon 3: Operations, Implementation Manual & Mission Control Skill (Task #240)
- **Objective:** Complete the delivery manual **and** an agent-facing skill so operators, other agents, and new COAs can implement, install, and operate Mission Control — including via the product API for other Primary Users.
- **Living outline (this tree):** `docs/ops/MISSION_CONTROL_OPS_MANUAL.md` (merged from `agent/coa` `6268c1c` for review; TBDs stay TBD until catalog/packaging are sequenced).
- **Governing design:** `docs/production/state/state_upgradability.md` (D1–D6 locked). Do not invent upgrade runbooks that contradict seed-only v1 (D4).
- **Deliverables:**
  1. Setup & deployment guides (Docker, local runtime, native reverse proxy).
  2. Ops runbooks for database backups, migrations, and maintenance.
  3. Implementer troubleshooting and self-healing diagnostics.
  4. **Mission Control skill** (`mission_control`) — loadable procedure for other agents and new COAs: how to style solutions to this product, implement against the HTTP API, install a host, and operate via API / Script Tasks for other Primary Users. The manual is the human/ops source; the skill points at the manual + locked D1–D6. Author later; do not mark `ready` until Stephen reviews the outline.

### Horizon 4: Production Polish & Domain Cutover
- **Objective:** Hardening, performance benchmarks, and formal production cutover (:3100 / public domain).
- **Deliverables:**
  1. End-to-end regression and permission validation across all roles.
  2. Production build pipeline & asset caching optimization.
  3. Production environment cutover.

---

## 4. Suggested Immediate Action Item

We recommend sequencing **Horizon 1 (Durable Catalog & Postgres Cutover)** as the immediate next development sprint. This anchors all the beautiful UI/Layout work done in the Records Editor into persistent database storage.

