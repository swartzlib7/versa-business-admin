# I5.6.32c — Records Editor (definition for review)

> **Owner:** Versa (COA) · **Product:** Mission Control (project #26)  
> **Source:** Stephen voice 2026-07-22 evening (site review + dynamic records direction)  
> **Status:** DEFINITION — awaiting Stephen review before build  
> **Last updated:** 2026-07-22  
> **Depends on:** I5.6.32a (nav/Qual Records), I5.6.32b (catalog schema API `df97fcf`)

---

## 1. Intent (restated)

We need a **Records Editor** so operators (and later agents) can declare **custom record types and fields under each data-model element**. Declared types become **additional tabs** (or named Records surfaces) on that element — not a single anonymous “Records” dump.

**Outcome:** extend the operational data model dynamically without collapsing first-class cores (Projects, Tasks, Products, Policy, Services) into generic EAV.

---

## 2. Naming

| Term | Meaning |
|------|---------|
| **Records Editor** | Admin UI + API to create/edit **record types** and their **fields** (and structure mode). Preferred product name. |
| **Record type** | A named kind of list/form under a parent element (e.g. `certification`, `public_mandate`). |
| **Record** | One instance of a type (row / header / header+lines). |
| **Baked-in object** | First-class model object with its own table/routes (Project, Task, Product, User, …). Not created via the editor. |
| **Parent element** | Zone node that owns tabs: faculty (Executive, Public, …), collaboration party (Vendor, …), or Environment node. |

Stephen also said “record editor” — we treat that as the same surface; **Records Editor** is the precise name (types + fields). Instance CRUD stays “Records” on the tab.

---

## 3. Core model

```
Parent element (faculty | collab party | environment node)
  ├── Configuration (always; existing)
  ├── Baked-in tabs (fixed; not editor-created)
  │     Executive: Policy, Projects, Tasks
  │     Production: Product, Service
  └── Dynamic tabs ← one per record type with show_as_tab (or named Records)
        └── Records of that type (list / header / header+lines)
```

### 3.1 Record type definition

| Field | Required | Notes |
|-------|----------|--------|
| `api_name` | yes | snake_case, unique within parent scope |
| `label` | yes | Tab / list title (e.g. “Certifications”) |
| `description` | no | Admin help |
| `parent_kind` | yes | `faculty` \| `collaboration` \| `environment` |
| `parent_api_name` | yes | e.g. `executive`, `public`, `vendor`, `branch` |
| `structure` | yes | `list` \| `header` \| `header_lines` (see §4) |
| `show_as_tab` | yes | default `true` — dedicated tab vs filter under a shared Records tab |
| `sort_order` | yes | Tab order among dynamic types |
| `active` | yes | Soft hide |
| `is_system` | yes | Baseline seeds = true (editable labels/fields carefully); user-added = false |
| `icon` | no | Optional tab glyph key |

### 3.2 Fields on a type

Reuse catalog field model (I5.6.32b / ERD-B):

- `api_name`, `label`, `data_type`, `is_required`, `default_value`
- `value_set_api_name` for picklists
- `lookup_object_api_name` for lookups
- `sort_order`, `active`, `is_system`

Layouts: default **list** columns + **detail/edit** sections generated from field order; advanced layout edit can follow (same engine as User pilot).

### 3.3 Instance data (build path)

| Phase | Storage |
|-------|---------|
| **Now (fixtures / UI)** | In-memory / fixture rows keyed by `type_api_name` + parent |
| **After Phase 2 go (preferred)** | `records(id, org_id, parent_kind, parent_api_name, type_api_name, name, status, data jsonb, …)` optional `record_lines` for header_lines |
| **Heavy relations later** | Promote a type to a typed table only if FKs/perf demand it |

**Does not** replace `projects` / `tasks` / `products` / `users`.

---

## 4. Structure modes (headers vs lines)

| `structure` | UI behavior | Data shape |
|-------------|-------------|------------|
| **`list`** | Flat table of records; row open → detail/edit | One row = one record; fields on `data` |
| **`header`** | Same as list but detail emphasizes a single “card” / form (no child lines) | One row; no lines table |
| **`header_lines`** | Header form + child line grid (order lines, checklist items, …) | Header record + `lines[]` each with own field set (line fields defined on type as `line_fields` or nested type) |

**v1 recommendation:** implement `list` + `header` fully; `header_lines` as schema + UI shell (add line / remove line) with a simple shared line field set on the type.

---

## 5. Where it applies

### 5.1 Organization faculties

| Parent | Baked-in tabs (fixed) | Dynamic record types (editor) |
|--------|----------------------|--------------------------------|
| **Executive** | Policy, Projects, Tasks | e.g. future types → new tabs (Stephen example: Executive has no generic Records today; editor **adds** tabs) |
| **Public** | — | Replace anonymous “Records” with **named** type(s); fields e.g. name, status, mandate |
| **Communications** | — | Same pattern |
| **Dissemination** | — | Same pattern |
| **Treasury** | — | Same pattern |
| **Production** | Product, Service | Extra tabs only via editor (products/services stay baked-in) |
| **Qualification** | — | e.g. split “Records” into **Certification**, **Audit**, … as separate types/tabs |

### 5.2 Collaboration elements

| Parent | Configuration | Dynamic types |
|--------|---------------|---------------|
| Vendor, Customer, Partner, Branch | Main config form | Record types declared per element → tabs |

### 5.3 Environment

Same: main configuration + optional record-type tabs per environment node.

---

## 6. Records Editor — product surface

### 6.1 Entry points

1. **Global admin:** Settings (or Executive tooling) → **Records Editor** — list all types, filter by parent.
2. **Contextual:** On a parent element’s Configuration → “Manage record types” → same editor scoped to that parent.

### 6.2 Editor capabilities (v1)

- Create / rename / deactivate type (not hard-delete if instances exist)
- Set `structure`, `show_as_tab`, sort order
- Add / edit / reorder fields (catalog data types)
- Bind picklists to value sets (create value set stub or pick existing)
- Preview list columns + empty state
- **Seed baselines** for Public/Comms/Dissemination/Treasury/Qualification so current placeholder Records become named types

### 6.3 API (extends I5.6.32b catalog)

Already shipped (read + field extend on known objects):

- `GET /api/catalog`, `/objects`, `/objects/{name}`, `/fields`, `/layouts`, `/value-sets`
- `POST /api/catalog/fields`

**Add for Records Editor (build slice):**

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/catalog/record-types` | List / create types |
| GET/PATCH | `/api/catalog/record-types/{api_name}` | Read / update type (+ parent scope query) |
| GET/POST | `/api/catalog/record-types/{api_name}/fields` | Fields for type (or reuse `/fields?object=`) |
| GET/POST | `/api/records?type=&parent=` | Instance list/create (fixture then DB) |

Creating a record type **registers** an `object_api_name` in the object registry (`core_kind: faculty_record`) so agents see it via existing catalog read APIs.

---

## 7. UI behavior on parent elements

1. Load baked-in tabs from zone definition (unchanged).
2. Load active record types for `parent_kind` + `parent_api_name` where `show_as_tab`.
3. Render each as a tab labeled with type `label` (Stephen: not a vague “Records” unless a single type is literally labeled that).
4. Tab body = EntityListing (or header form / header+lines) driven by that type’s field + layout definitions.
5. If multiple types have `show_as_tab: false`, optional single **Records** tab with type filter (escape hatch).

**Public today:** one Records tab with weak columns → migrate to type `public_item` (label configurable, e.g. “Public records” or “Mandates”) with fields name, status, mandate, …

---

## 8. Relationship to prior slices

| Slice | Status | Role |
|-------|--------|------|
| **32a** | Shipped | Nav de-dupe; Qual Records child; keep Projects/Tasks first-class |
| **32b** | Shipped `df97fcf` | Agents read/extend schema via `/api/catalog` |
| **32c** | **This definition** | Records Editor + type-driven tabs + baseline seeds |
| **32d** | After 32c build | Polish dynamic tabs / deep links |
| **Phase 2 DB** | Gated | User pilot; records table can follow or ride along — **not** unblocked by this doc alone |

---

## 9. Build sequence (after Stephen approves definition)

| Step | Work | Who |
|------|------|-----|
| **32c.1** | Fixture `recordTypes[]` + baseline seeds; register in catalog object registry | COA or web-dev |
| **32c.2** | API: record-types CRUD + wire object registry on create | COA or web-dev |
| **32c.3** | ZoneConfigView: tabs from types; drop generic placeholder columns | web-dev |
| **32c.4** | Records Editor UI (global + contextual entry) | web-dev |
| **32c.5** | Instance fixture CRUD for list/header; header_lines shell | web-dev |
| **32c.6** | Collaboration + Environment parents | web-dev |
| **32c.7** | Docs/WBS/state; preview :3100 | COA |

---

## 10. Out of scope (this definition)

- Turning Projects/Tasks/Products/Policy/Services into editor-created types
- End-user arbitrary SQL/DDL
- Phase 2 DB cutover without explicit go
- Shortcuts/favorites nav
- Full ERP document engine (only header_lines pattern)

---

## 11. Acceptance (definition)

- [ ] Stephen confirms naming (**Records Editor**)
- [ ] Stephen confirms structure modes (`list` / `header` / `header_lines`)
- [ ] Stephen confirms parent coverage (Org faculties + Collab + Environment)
- [ ] Stephen confirms baked-ins stay fixed
- [ ] Stephen confirms v1 build order (or adjusts)
- [ ] Then implement 32c.1+

---

## 12. Open points (only if Stephen wants to steer)

1. **Default labels** for current Public/Comms/… placeholders (keep “Public records” vs domain names).
2. **Executive:** any baseline dynamic type in v1, or editor-empty until user adds?
3. **header_lines:** required in first build vs phase-two of 32c?
4. **Who may edit types:** admin only (recommended v1) vs selected roles?

---

## 13. One-screen summary

**Records Editor** lets us attach named, fielded record types to any parent element. Each type can appear as its own tab. Structure is list, single header, or header+lines. Baked-in Executive/Production objects stay first-class. Catalog API (32b) is how agents read and extend the same definitions. Build starts after this doc is approved.
