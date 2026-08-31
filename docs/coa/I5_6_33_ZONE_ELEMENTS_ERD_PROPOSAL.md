# I5.6.33 — Zone Elements, Record Types & Schema ERD (rev C)

> Owner: Versa (COA) | Product: Mission Control (project #26) | Game #109
> Task: #241 | Status: REDRAFT for Stephen review — supersedes rev B (e895502, 2026-08-31)
> Date: 2026-08-31 | Branch: beta | Base: 7cc408f (#218 Gate 2 PASS)
> Review basis: Stephen's rev B feedback (2026-08-31 02:59) + 6-message review (2026-08-31) + alignment restatement (erd_review_alignment_2026-08-31.md)

---

## 1. What changed since rev B

Stephen's rev B feedback flagged the **'Config Form' column** in the element table as confusing.
It was a rev-A UI-shape leftover — in the record-type-centric model the faculty Configuration
forms are a separate, already-settled concern (§4.5), so the column is **removed entirely** (§3).

New in rev C — the **multi-organization pattern** (locked by Stephen, 2026-08-31):

- Multiple organizations are definable in the system.
- The logged-in user sets a **default organization**.
- Every new record **auto-presets its organization field** from that default (user-changeable
  per record where multiple organizations exist).
- **All data relates to organization records** (§2.5, §4.2, §5).

Plus one new confirm point: **C5 — organizations as core system table** (§9).

Rev A §4/§7 superseded by rev B; rev B §3 table superseded by this revision's §3. The senior
pattern (§2), locked relation decisions (§6), and implementation realignment (§7) carry forward
unchanged except where the organization pattern threads through.

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

### 2.5 Multi-organization pattern (LOCKED, 2026-08-31)

- **Multiple organizations** are definable in the system.
- The logged-in user selects a **default organization** (a user-level setting).
- **Every new record auto-presets its `org_id` from the user's default organization** at creation.
  The field is **user-changeable per record** wherever multiple organizations exist.
- **All data relates to organization records** — organization is the tenant root every content
  record hangs from (see §4.2 and §5).

Implementation notes:
- `record_type.org_id` and `record.org_id` are the concrete carriers (§4.2).
- Catalog tables that already carry `org_id` (value_set, field_definition, layout_definition)
  keep it — same pattern, no change.
- The default-organization selection is a **user preference** (users table or user_settings),
  not a record-type concern.
- Auto-preset is **creation-time behavior** in the Records Editor / API layer: prefill `org_id`
  from the user default; the field renders editable (dropdown of organizations) when the user
  has more than one organization available, read-only when only one exists.

---

## 3. Locked element content (from Stephen's review)

All decisions below are locked from the 2026-08-31 review. Element content = the element's
record types. "Seeded" = already seeded by #218 on beta (7cc408f).
(The rev-A/rev-B 'Config Form' column is removed — faculty Configuration forms are settled
separately as singleton `element_config` records, §4.5.)

| Zone | Element | Record types (system, locked) | Structure | Notes |
|---|---|---|---|---|
| Org | Executive | executive_policy *(seeded)* | header_lines | Fields §3.1; one-to-many to all 4 parties + 4 env nodes |
| Org | Executive | executive_project *(seeded)* | header_lines ⚠ | Lines: milestones, budget lines, risks (rev A carry-over) |
| Org | Executive | executive_task *(seeded)* | header_lines ⚠ | Lines: subtasks, time entries, attachments (rev A carry-over) |
| Org | Public | public_contact *(new)* | list | Contacts list |
| Org | Communications | communication_message *(new)* | list | Messages list, **typed** — `message_type` picklist value set |
| Org | Dissemination | dissemination_campaign *(new)* | header_lines ⚠ | Campaigns — relatable to parties + environment nodes |
| Org | Treasury | treasury_account, treasury_transaction, treasury_budget *(new)* | list | Purchase orders deferred (Stephen's call later) |
| Org | Production | production_product *(seeded)*, production_service *(seeded)* | header_lines ⚠ | Referenced by quotes, invoices, campaigns (lookups) |
| Org | Qualification | qualification_record *(new)* | list | QC records relating to all organization-zone children |
| Collab | Vendor | vendor *(new)* | header_lines | Lines: contacts, contracts, integrations |
| Collab | Customer | customer *(new)* | header_lines | Lines: contacts, orders, contracts |
| Collab | Partner | partner *(new)* | header_lines | Lines: contacts, agreements, investments |
| Collab | Branch | branch *(new)* | header_lines | Lines: **contacts only** (staff = a type of contact; sub-branches out) |
| Collab | Vendor ▸ Integrations | vendor_integration *(seeded)* | list | Stays a record type related to vendor, or becomes a lines group — see §7.6 |
| Env | Locations / Events / Knowledge / Schedules | location, event, knowledge, schedule *(new)* | **list** | Environment nodes stay lists (locked) |

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
Confirm with your next review (C4).

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
      id, org_id → organizations.id,
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
      id, org_id → organizations.id,
      type_api_name → record_type.api_name,
      name, status,
      data JSONB,                -- header field values (field_definition-driven)
      created_by → users.id,
      created_at, updated_at
    )

    record_line (
      id, record_id → record.id (CASCADE),
      line_group_api_name,       -- groups per the type's line groups
      seq,
      data JSONB,
      created_at, updated_at
    )

    record_relations (
      id, org_id → organizations.id,
      source_record_id → record.id,
      target_record_id → record.id,
      relation_kind → value_set (relation_kind),
      created_by, created_at,
      UNIQUE (source_record_id, target_record_id, relation_kind)
    )

Organization pattern (§2.5): `org_id` on record_type, record and record_relations is the
concrete carrier; **auto-preset at creation from the user's default organization**, editable
per record where multiple organizations exist. Record lines inherit their parent record's
organization — no separate org_id on record_line.

### 4.3 Lookup delete rule

`field_definition` gains `lookup_object_api_name` + `lookup_delete_rule`
(`cascade` = master-detail | `orphan` = plain lookup; default per confirm point C2).
Structural record → lines ownership stays built-in cascade.

### 4.4 record_relations

Already sketched in rev A; carried unchanged — relation_kind from the locked `relation_kind`
value set; both directions navigable on detail pages.

### 4.5 element_config (faculty config singletons)

The 7 faculty Configuration forms persist as singleton `element_config` records (one per faculty)
instead of hardcoded form mocks. Config is per-faculty settings — distinct from content record types.
(This is why the §3 table no longer carries a Config Form column — config is settled here.)

### 4.6 Typed tables vs record types (cutover note)

Zone content (policy, projects, tasks, product, service, parties, integrations, environment) is
**record-type-centric** per this document. The existing typed tables (projects, tasks, products,
integrations, parties) remain for current admin surfaces until the cutover decision recorded in
docs/design/spec/state/state_db_cutover_checklist.md. Platform primitives (organizations,
departments, users) stay typed. See confirm points C1 and C5 (§9).

---

## 5. ERD (Mermaid, rev C)

    ORGANIZATION ||--o{ RECORD_TYPE : "tenant root (org_id)"
    ORGANIZATION ||--o{ RECORD : "tenant root (org_id)"
    ORGANIZATION ||--o{ RECORD_RELATION : "tenant root (org_id)"
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
- ORGANIZATION is the tenant root: every content row (record_type, record, record_relations)
  carries org_id, auto-preset from the user's default organization at creation (§2.5).
- ELEMENT is polymorphic: faculty | collaboration | environment | baked_in (three-zone landing).
- RECORD parent is the record TYPE (canonical); no per-instance parent in Horizon 1.
- Core platform tables (organizations, departments, users) stay typed per locked philosophy —
  see confirm point C5 on organizations as the core system table.

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
| All data | Relates to organization records (§2.5) |

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
7. **Organization auto-preset:** Records Editor / API creation paths prefill `org_id` from the
   logged-in user's default organization; editable per record where multiple organizations exist
   (§2.5). Single-org users see it read-only.

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
- **C5 — Organizations as core system table (tenant root):** recommended reading — `organizations`
  stays a typed core platform table (tenant root); record_type / record / record_relations
  reference it via org_id with the §2.5 auto-preset behavior. Alternative: model organizations
  themselves as record types. Confirm.

---

## 10. Next steps

1. Stephen reviews §2.5, §3 and §5 and ticks confirm points C1–C5.
2. Lock built-in element definitions + new system types as Horizon 1 seed data.
3. Horizon 1 proceeds: record_type, record, record_line, record_relations tables +
   lookup_delete_rule + element_config + organization auto-preset + full system-type seed.
4. Web-dev resumes dynamic-records slices (#185) on the locked schema; 8 parent tabs wiring
   follows as the next zone-pages slice.
