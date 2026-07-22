# I5.6.32 — Dynamic records redesign (COA plan)

> **Owner:** Versa (COA) · **Product:** Mission Control (project #26)  
> **Source:** Stephen voice 2026-07-22 (menu IA + config-driven records + Projects/Tasks caveat)  
> **Status:** Plan locked for implementation sequencing · **Last updated:** 2026-07-22

---

## 1. Verdict — Projects & Tasks as generic dynamic records?

**Recommendation: KEEP Projects and Tasks as first-class tables (and first-class UI objects). Do NOT collapse them into a generic EAV / single `records` table.**

### Why (verified against current schema + app)

| Concern | Evidence in codebase | If forced into generic records |
|--------|----------------------|--------------------------------|
| **Relations** | `tasks.project_id` → `projects.id` (required FK). `projects.owner_user_id` → `users`. `integrations.product_id` → `products`. | Generic row store loses cheap typed FKs; joins become JSON path / polymorphic `record_links` with weaker integrity. |
| **Integrity** | Status/priority CHECKs on `projects` and `tasks`; not-null project on every task. | Either re-implement constraints in app code or accept soft failures. |
| **Performance** | Indexed relational path for list-by-project, assignee, due date (Phase 2+ queries). | EAV / wide JSONB filters are slower and harder to index for the hot paths (task boards, project rollups). |
| **API & routes** | `/api/projects`, `/api/tasks`, `/projects`, `/tasks` already shaped around typed resources (ERD-D). | Would force a parallel generic CRUD or a breaking rewrite mid-cutover. |
| **Catalog already helps** | `field_definition` / `layout_definition` / `value_set*` already describe **fields & layouts per `object_api_name`** without replacing the table. | This is the right “dynamic” layer — metadata on top of typed cores. |

**Product / Service:** same pattern — keep `products` (and future services) first-class; use catalog for field/layout variance. Nested under Production in IA, not main nav.

**When to “bake in” a repeating dynamic pattern:** after 2+ faculties share the same shape (e.g. Public/Comms/Dissemination/Treasury/Qualification **Records** lists) and we have real usage — then promote a `record_type` + `record` (or faculty-scoped) table with typed `type_api_name`, still **without** absorbing Project/Task.

Stephen’s gate matches the schema: *only if* relations/performance hurt → keep first-class. **They would hurt. Keep them.**

---

## 2. What “more dynamic” means (refined approach)

Three layers — do not conflate:

| Layer | Role | Dynamic? |
|-------|------|----------|
| **A. Typed core objects** | `projects`, `tasks`, `products`, `users`, `parties`, … | Schema-first; catalog-driven **forms/lists** (already ERD-B/C/D). |
| **B. Faculty Records** | Generic operational lists under Public / Comms / Dissemination / Treasury / Qualification | **Config-driven record types** (baseline shipped); UI tabs from definitions. |
| **C. Shell IA** | Main nav + zone Configuration chrome | Nav is zone-centric; no duplicate object menus; shortcuts later. |

Executive **Policy / Projects / Tasks** and Production **Product / Service** stay **named instances** in zone IA (and typed tables where they exist). They are not “just another free-form record type,” but their **screens** should increasingly render from catalog layouts (same engine as User pilot).

---

## 3. Immediate IA (this cycle + next)

### 3.1 Main menu (DONE this cycle — I5.6.32a)
- Remove top-level **Projects**, **Tasks**, **Products** from sidebar.
- Keep routes `/projects`, `/tasks`, `/products` for deep link + zone panel links.
- **Shortcuts / favorites** menu: backlog only (Stephen: not now).

### 3.2 Qualification Records (DONE this cycle — I5.6.32a)
- Qualification = Configuration + **Records** child (parity with Public/Comms/Dissemination/Treasury).
- Sample columns placeholder until Stephen defines real types.

### 3.3 Zone panel deep links (NEXT — web-dev or COA)
- From Executive → Projects / Tasks listings: primary UX is zone listing; optional “Open full page” → existing routes.
- From Production → Product / Service: same.
- Ensure no IA copy still says “use main menu”.

---

## 4. Config-driven Records (design target)

### 4.1 Baseline config (ship with system)
Define `record_type` seeds, e.g.:

| type_api_name | faculty | label | default list columns |
|---------------|---------|-------|----------------------|
| `public_item` | public | Public records | Name, Status |
| `comms_item` | communications | Communications records | Name, Channel |
| `dissemination_item` | dissemination | Dissemination records | Name, Channel |
| `treasury_item` | treasury | Treasury records | Name, Kind, Status |
| `qualification_item` | qualification | Qualification records | Name, Type, Status |

Policy can be a **typed** or **record_type** later; not blocking.

### 4.2 Runtime UI
- Faculty tab strip: **Configuration** | **Records** | *(optional extra tabs per configured type, accent variant)*.
- Records view: listing + inline new/edit driven by `field_definition` + `layout_definition` for that `object_api_name` / type.
- Prefer **one Records tab** that filters by type, or **dynamic sub-tabs** from config (Stephen’s “different color tab” idea) — implement as presentation option on the type definition (`show_as_tab: boolean`).

### 4.3 Data (sequencing vs Phase 2)
- **UI mock path (now):** zone-definitions + fixtures (current).
- **DB path (after or with Phase 2+):** either  
  - (preferred) `records(id, org_id, faculty, type_api_name, name, status, data jsonb, …)` + type catalog, **or**  
  - faculty-specific tables if a type gains heavy relations.  
- **Do not** block Phase 2 User pilot on Records tables — User pilot stays Track B Phase 2 as defined.

---

## 5. Work breakdown

| ID | Work | Who | Depends |
|----|------|-----|---------|
| **32a** | Nav de-dupe + Qualification Records + this plan + state/WBS | **COA** shipped ada18f3 | — |
| **32b** | Catalog schema API for agents (read objects/fields/layouts + POST extend field) | **COA** | 32a |
| **32b** | Zone listings: clarify Projects/Tasks/Products only under Executive/Production; deep-link buttons; copy pass | COA or web-dev | 32a |
| **32c** | `record_type` fixture module + ZoneConfigView reads types for faculty Records (dynamic columns/sample) | COA plan → web-dev impl | 32a |
| **32d** | Dynamic extra tabs from types with `show_as_tab` | web-dev | 32c |
| **32e** | Optional: catalog layouts for Policy / Project / Task / Product zone panels (reuse User layout engine) | web-dev | 32c, ERD-D |
| **32f** | Shortcuts/favorites nav | later | Stephen revisit |
| **32g** | DB `records` + seed types | after Phase 2 go / with Phase 3+ | Track B |

Phase 2 DB seed/read **remains gated** on Stephen’s explicit go. Redesign does not unlock it.

---

## 6. Out of scope
- Absorbing Projects/Tasks/Products into generic records.
- Building shortcuts menu now.
- Dynamic DDL / end-user schema admin polish.
- Sharing host AGi Organization tables with Mission Party.

---

## 7. Acceptance

### 32b (catalog API)
- [x] GET /api/catalog (+ objects, fields, layouts, value-sets)
- [x] GET object schema bundle
- [x] POST /api/catalog/fields (admin extend, fixture-local)
- [x] API index lists catalog endpoints

### 32a
- [x] No Projects/Tasks/Products on main sidebar.
- [x] Qualification has Records child.
- [x] Written verdict + plan in `docs/coa/`.
- [ ] Stephen ack on verdict + plan direction.
- [ ] Preview :3100 rebuilt for 32a.

---

## 8. Message to implementers (web-dev)
Pull `beta` after 32a lands. Do **not** start generic Project/Task tables. Next likely assignable slice: **32c** record_type fixtures + wire faculty Records from config (COA will task explicitly).
