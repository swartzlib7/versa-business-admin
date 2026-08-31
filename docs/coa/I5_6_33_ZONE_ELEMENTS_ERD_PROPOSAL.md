# I5.6.33 — Zone Elements, Record Types & Schema ERD (rev B)

> Owner: Versa (COA) | Product: Mission Control (project #26) | Game #109
> Task: #241 | Status: REDRAFT for Stephen review — supersedes rev A (2026-08-30)
> Date: 2026-08-31 | Branch: beta | Base: 7cc408f (#218 Gate 2 PASS)
> Review basis: Stephen's 6-message review (2026-08-31) + alignment restatement (erd_review_alignment_2026-08-31.md)

---

## 1. What changed since rev A

Stephen's review corrected the foundation: elements like Policy are **record TYPES holding many
record instances** — each instance carries its own header fields and its own lines. Rev A modeled
Policy as one header_lines record; that is replaced here by the record-type-centric model.

- Rev A §4 (element definitions) and §7 (ERD) — superseded by this revision.
- Rev A §5 (40-hint cross-element matrix) — **HELD by Stephen**; not re-litigated here (§8).
- All 5 rev A open questions — answered in review and folded in (§3, §4).
- Record relations — **HORIZON 1, LOCKED** (was rev A open question 5).

Nothing here changes the UI by itself. This is the data-model contract Horizon 1 persistence implements.

---

## 2. The senior pattern (normative)

### 2.1 Elements are record types; instances are records

Every element that holds content (Policy, Projects, Tasks, Product, Service, parties, …) is a
**record type**. A record type holds **many record instances**. Each instance has:

- its own **header** — the fields defined on the record type (title, scope, owner, dates, …), and
- its own **lines** — repeating child rows grouped per the type's line groups.

Not one header config with lines hanging off it. The faculty Configuration forms remain a separate
concern: each of the 7 faculties keeps its singleton config record (§4.5) — config is not content.

### 2.2 Lookups between record definitions

Record definitions can **look up to other record definitions**. Two semantics, chosen per lookup:

| Kind | Delete behavior | Use when |
|---|---|---|
| **Master-detail** | Deleting the parent takes its children with it (cascade) | Child cannot exist without parent (contract → vendor) |
| **Plain lookup** | Children are orphaned and remain (reference cleared/null) | Reference is optional context (policy → knowledge asset) |

Mechanism: a lookup field on a record definition carries `lookup_object_api_name` (target) plus a
**delete rule** (`cascade` = master-detail, `orphan` = plain lookup). Structural ownership
(record → its lines) is always cascade and is not a lookup — it is built-in.

### 2.3 System types locked; custom types via the same mechanism

- **System record types** come preconfigured and **locked** — they cannot be removed
  (`is_system`, enforced in the Records Editor today at records-editor.tsx:449).
- Users create **custom record types and lookups through the same mechanism** (Records Editor)
  and land them anywhere in the **three-zone structure** (Organization / Collaboration /
  Environment — three zones only, for now).

### 2.4 Label rule

A record type's **label must be unique within its parent element** but may be **reused across
elements** (two elements can each have a "Contacts" type). `api_name` remains globally unique.
This resolves the vendor problem: Vendor is a list of vendor records, each with its own contacts /
contracts / integrations — same for customer, partner, branch.

---

## 3. Locked element content (from Stephen's review)

All decisions below are locked from the 2026-08-31 review. Element content = the element's
record types. "Seeded" = already seeded by #218 on beta (7cc408f).

| Zone | Element | Config form | Record types (system, locked) | Structure | Notes |
|---|---|---|---|---|---|
| Org | Executive | Yes | executive_policy *(seeded)* | header_lines | Fields §3.1; one-to-many to all 4 parties + 4 env nodes |
| Org | Executive |  | executive_project *(seeded)* | header_lines ⚠ | Lines: milestones, budget lines, risks (rev A carry-over) |
| Org | Executive |  | executive_task *(seeded)* | header_lines ⚠ | Lines: subtasks, time entries, attachments (rev A carry-over) |
| Org | Public | Yes | public_contact *(new)* | list | Contacts list |
| Org | Communications | Yes | communication_message *(new)* | list | Messages list, **typed** — `message_type` picklist value set |
| Org | Dissemination | Yes | dissemination_campaign *(new)* | header_lines ⚠ | Campaigns — relatable to parties + environment nodes |
| Org | Treasury | Yes | treasury_account, treasury_transaction, treasury_budget *(new)* | list | Purchase orders deferred (Stephen's call later) |
| Org | Production | Yes (not a listing) | production_product *(seeded)*, production_service *(seeded)* | header_lines ⚠ | Referenced by quotes, invoices, campaigns (lookups) |
| Org | Qualification | Yes | qualification_record *(new)* | list | QC records relating to all organization-zone children |
| Collab | Vendor | — | vendor *(new)* | header_lines | Lines: contacts, contracts, integrations |
| Collab | Customer | — | customer *(new)* | header_lines | Lines: contacts, orders, contracts |
| Collab | Partner | — | partner *(new)* | header_lines | Lines: contacts, agreements, investments |
| Collab | Branch | — | branch *(new)* | header_lines | Lines: **contacts only** (staff = a type of contact; sub-branches out) |
| Collab | Vendor ▸ Integrations | — | vendor_integration *(seeded)* | list | Stays a record type related to vendor, or becomes a lines group — see §7 |
| Env | Locations / Events / Knowledge / Schedules | — | location, event, knowledge, schedule *(new)* | **list** | Environment nodes stay lists (locked) |

⚠ = structure change required from the current #218 seed (`list` → `header_lines`), because each
instance now carries its own header + lines. See §7.

### 3.1 Policy (executive_policy) — header fields

Per Stephen: created / last-modified / review / effective datetimes + optional new-version checkbox.

- `created_at`, `updated_at` — system timestamps on every record (no per-type definition needed)
- `effective_date` (datetime), `review_date` (datetime)
- `new_version` (boolean, optional checkbox)
- Plus rev A baseline: name, status, scope (picklist), owner (lookup → users), summary
- Lines: policy lines (per #218 seed — zone_role=list, show_in_column)

Interpretation flag: if the new-version checkbox is meant to **link a policy to its predecessor**,
we add an optional `supersedes` lookup (plain lookup, orphan) revealed when the checkbox is set.
Confirm with your next review.

### 3.2 Executive one-to-many (locked)

Policy, Projects and Tasks each relate **one-to-many to all four parties AND all four environment
nodes**. Implemented via `record_relations` (§4.4): from an executive record, multiple party and
environment relations; navigation presented both ways on detail pages.

---

## 4. Data model (Horizon 1)

### 4.1 Already persisted (catalog tables, live today)

`value_set`, `value_set_item`, `field_definition`, `layout_definition` — as coded in
src/lib/db/schema.ts. The 26-field catalog seed (#218) wires the 6 seeded types to the 7 locked
value sets.

### 4.2 New record tables (Horizon 1 scope)

    record_type (
      id, org_id,
      api_name  UNIQUE,          -- globally unique
      label,
      parent_kind,               -- faculty | collaboration | environment | baked_in
      parent_api_name,           -- element api_name — three-zone landing
      structure,                 -- list | header | header_lines
      is_system  BOOLEAN,        -- preconfigured + locked (cannot be removed)
      active, created_at,
      UNIQUE (parent_kind, parent_api_name, label)   -- §2.4 label rule
    )

    record (
      id, org_id,
      type_api_name → record_type.api_name,
      name, status,
      data JSONB,                -- header fields per field_definition
      created_at, updated_at
    )

    record_line (
      id, org_id,
      record_id → record.id ON DELETE CASCADE,   -- structural ownership, always cascade
      data JSONB, sort_order
    )

Note: today's fixtures carry `parent_kind`/`parent_api_name` on each instance (denormalized).
Horizon 1 canonical parent is the **record type**; instances inherit placement from their type.

### 4.3 Lookup fields and delete rules

`field_definition` gains one column:

    lookup_delete_rule TEXT CHECK (lookup_delete_rule IN ('cascade','orphan')) DEFAULT 'orphan'

- `cascade` = master-detail (delete parent → children deleted)
- `orphan` = plain lookup (delete referenced → referencing rows keep living, reference cleared)

`lookup_object_api_name` targets extend to **any recordable element** (system or custom type).

### 4.4 record_relations — HORIZON 1 (LOCKED)

    record_relations (
      id, org_id,
      source_type, source_id, source_kind,   -- record | record_type | <typed table>
      target_type, target_id, target_kind,
      relation_kind,                         -- value_set-backed picklist (extensible, no DDL)
      sort_order, data JSONB, created_at
    )

- Polymorphic addressing (type + id + kind) — same pattern as record parents; no hard FKs to typed
  tables; integrity enforced at the API layer.
- `relation_kind` from a value_set so the relation vocabulary grows without DDL.
- Two indexes (source, target) for bidirectional queries.

### 4.5 element_config (faculty config singletons)

The 7 faculty Configuration forms persist as singleton `element_config` records (one per faculty)
instead of hardcoded form mocks. Config is per-faculty settings — distinct from content record types.

### 4.6 Typed tables vs record types (cutover note)

Zone content (policy, projects, tasks, product, service, parties, integrations, environment) is
**record-type-centric** per this document. The existing typed tables (projects, tasks, products,
integrations, parties) remain for current admin surfaces until the cutover decision recorded in
docs/design/spec/state/state_db_cutover_checklist.md. Platform primitives (organizations,
departments, users) stay typed. See confirm point C1 (§9).

---

## 5. ERD (Mermaid, rev B)

    ORGANIZATION ||--o{ ELEMENT_CONFIG : "faculty config singleton"
    ELEMENT ||--o{ RECORD_TYPE : "declares (parent_kind + parent_api_name)"
    RECORD_TYPE ||--o{ FIELD_DEFINITION : "defines (object_api_name)"
    RECORD_TYPE ||--o{ RECORD : "instantiates"
    RECORD ||--o{ RECORD_LINE : "lines (structural, always cascade)"
    RECORD ||--o{ RECORD_RELATION : "as source"
    RECORD ||--o{ RECORD_RELATION : "as target"
    RECORD }o--o{ RECORD : "lookup fields (cascade = master-detail | orphan = plain)"
    FIELD_DEFINITION }o--o| VALUE_SET : "picklist"
    RECORD_RELATION }o--|| VALUE_SET : "relation_kind"
    LAYOUT_DEFINITION }o--|| RECORD_TYPE : "detail / edit / list"

Notes:
- ELEMENT is polymorphic: faculty | collaboration | environment | baked_in (three-zone landing).
- RECORD parent is the record TYPE (canonical); no per-instance parent in Horizon 1.
- Core platform tables (organizations, departments, users) stay typed per locked philosophy.

---

## 6. Locked relation decisions (from review — not the held matrix)

| Relation | Decision |
|---|---|
| Executive Policy / Projects / Tasks | One-to-many to all 4 parties AND all 4 environment nodes |
| Dissemination campaigns | Relatable to parties + environment nodes |
| Qualification QC records | Relate to all organization-zone children |
| Production product & service | Referenced by quotes, invoices, campaigns (lookups into product/service) |
| Treasury | Accounts, transactions, budgets (POs deferred) |
| Branch | Contacts only |
| Environment nodes | Stay lists; relate cross-element (matrix held) |

The full 40-hint cross-element matrix remains **HELD by Stephen** — it returns for review after
these changes settle.

---

## 7. Implementation realignment (current code → target)

1. **Done (#218, beta 7cc408f):** 6 system record types seeded (executive_policy header_lines;
   executive_project, executive_task, production_product, production_service, vendor_integration
   as list) + 26-field catalog seed wired to 7 value sets; baked listing tabs wired to system
   types; sampleRows mocks removed from the 6 baked children.
2. **Structure corrections (⚠ in §3):** executive_project, executive_task, production_product,
   production_service move `list` → `header_lines` (each instance = header + lines). Lines groups
   per §3 table (rev A carry-over, now per-instance). executive_policy already header_lines.
3. **Detail views:** tabs render **list → detail** — each instance opens its own header + lines.
   This is the Policy correction Stephen called out (single-form → list→detail), applied to
   Projects, Tasks, Product, Service, Integrations and the four parties alike.
4. **New system types seed (§3 "new" rows):** public_contact, communication_message (+ message_type
   value set), dissemination_campaign, treasury_account, treasury_transaction, treasury_budget,
   qualification_record, vendor, customer, partner, branch, location, event, knowledge, schedule.
5. **Residual (named in #218 Gate 1, Amendment 1):** the 8 parent tabs (vendor, customer, partner,
   branch, locations, events, knowledge, schedules) still render sampleRows mocks — wiring them to
   the new system types is the follow-up proposal after this document is locked.
6. **vendor_integration:** stays a record type related to vendor (lookup), or becomes a lines group
   on vendor instances — see confirm point C3 (§9).

---

## 8. Held by Stephen (not decided here)

- Cross-element relatability matrix (rev A §5, 40 hints) — returns after these changes settle.
- Purchase orders under Treasury — Stephen's call later.
- Anything beyond the three-zone structure.

---

## 9. Confirm points (only genuine ambiguities — everything else is locked)

- **C1 — Party instances as records:** §3 models vendor/customer/partner/branch as system record
  types (senior pattern: "Vendor becomes a list of vendor records"). The typed `parties` table
  then serves only legacy surfaces until cutover. Confirm, or keep party instances in the typed
  table and relate records to them polymorphically.
- **C2 — Lookup delete-rule default:** `orphan` (plain lookup) as default, `cascade`
  (master-detail) opt-in per field. Confirm.
- **C3 — Treasury as three record types:** "treasury lines = accounts, transactions, budgets" is
  modeled as three system record types under Treasury (each holding many instances). Alternative:
  one Treasury element with three lines groups on a singleton — which contradicts the senior
  pattern, so records is the recommended reading. Confirm.
- **C4 — Policy new-version checkbox:** if it should link the new version to its predecessor, we
  add an optional `supersedes` lookup (plain lookup). Confirm intent.

---

## 10. Next steps

1. Stephen reviews §2–§5 and ticks confirm points C1–C4.
2. Lock built-in element definitions + new system types as Horizon 1 seed data.
3. Horizon 1 proceeds: record_type, record, record_line, record_relations tables +
   lookup_delete_rule + element_config + full system-type seed.
4. Web-dev resumes dynamic-records slices (#185) on the locked schema; 8 parent tabs wiring
   follows as the next zone-pages slice.
