# I5.6.33 - Zone Elements, Relatability and Schema ERD Proposal

> Owner: Versa (COA) | Product: Mission Control (project #26) | Game #109
> Task: #241 | Status: DRAFT for Stephen review
> Date: 2026-08-30 | Branch: beta | Base: 521f5e1 (O1-O2 accepted)

---

## 1. Purpose

Horizon 1 (Durable Postgres Catalog) needs the built-in element definitions locked first -
which elements exist per zone, which carry lines vs header-only, and how elements relate to one
another. This document proposes exactly that, grounded in the current code (zone-definitions.ts,
record-types.ts, record-instances.ts, schema.ts) and the locked I5.6 IA.

Nothing here changes the UI. This is the data-model contract Horizon 1 persistence will implement.

---

## 2. Current Built-in Element Inventory (as coded today)

### 2.1 Organization zone (7 faculties)

| Element | Config form | Baked-in children (today) | Notes |
|---|---|---|---|
| Executive | Yes (default) | Policy, Projects, Tasks (all listing) | Center sphere |
| Public | Yes | - | Top sphere; distinct from Collaboration Customer |
| Communications | Yes | - | |
| Dissemination | Yes | - | |
| Treasury | Yes | - | |
| Production | Yes (default) | Product, Service (listing) | Config form is NOT a production listing |
| Qualification | Yes | - | List TBD next pass |

### 2.2 Collaboration zone (4 parties)

| Element | Today | Children |
|---|---|---|
| Vendor | listing | Integrations (listing) |
| Customer | listing | - |
| Partner | listing | - |
| Branch | listing | - |

### 2.3 Environment zone (4 nodes)

| Element | Today |
|---|---|
| Locations | listing |
| Events | listing |
| Knowledge | listing |
| Schedules | listing |

---

## 3. Structural Model: Header vs Lines

Three structures exist in the Records Editor: list, header, header_lines.

- Header-only (form): one configurable record per element - the faculty Configuration forms.
- Listing (list): many records, flat table.
- Header + lines: one record with repeating child rows (like a quote with line items).

Stephen flagged the first correction: Policy under Executive should be lines, not header-only -
the intent is to create policy records for different parts of the organization, each with its own
fields and relations.

---

## 4. Proposed Built-in Element Definitions (Horizon 1 seed data)

### 4.1 Organization faculties - header-only (config form records)

Executive, Public, Communications, Dissemination, Treasury, Production, Qualification.
Each keeps its Configuration form as today. These become persisted singleton records
(element_config) rather than hardcoded form mocks.

### 4.2 Listing children to header_lines (Stephen: Policy first)

| Element | Parent | Proposed structure | Lines groups (proposed) |
|---|---|---|---|
| Policy | Executive | header_lines | Policy lines: title, scope (picklist), owner (lookup to User), summary, effective date, review date |
| Projects | Executive | header_lines | Milestones, Budget lines, Risks |
| Tasks | Executive | header_lines | Subtasks, Time entries, Attachments |
| Product | Production | header_lines | Variants, Pricing tiers, Components |
| Service | Production | header_lines | Rate lines, Deliverables, SLA terms |
| Integrations | Vendor | header_lines | Credentials, Endpoints, Sync logs |

### 4.3 Collaboration parties to header_lines

| Element | Lines groups (proposed) |
|---|---|
| Vendor | Contacts, Contracts, Integrations (existing child becomes a lines group or stays a tab) |
| Customer | Contacts, Orders, Contracts |
| Partner | Contacts, Agreements, Investments |
| Branch | Contacts, Staff, Sub-branches |

### 4.4 Environment nodes - stay list-structure

Locations, Events, Knowledge, Schedules remain standalone record lists (no parent header).
They relate cross-element (see section 6) but do not need header/lines structure.

### 4.5 Dynamic record types

Unchanged: created via Records Editor with structure = list | header | header_lines,
parented to any of the 15 editor parents (7 faculties + 4 parties + 4 environment nodes).

---

## 5. Cross-Element Relatability (current UI hints, to become real relations)

The 40 relations declared in zone-definitions.ts, grouped:

| Source element | Relates to | Label (UI hint today) |
|---|---|---|
| executive | Collaboration | Key accounts |
| executive | Environment | Strategy knowledge |
| policy | Environment | Knowledge assets |
| policy | Organization | Owning faculty |
| projects | Organization | Tasks |
| projects | Collaboration | External parties |
| tasks | Organization | Parent project |
| tasks | Environment | Schedule |
| public | Collaboration | Audience parties |
| public | Environment | Public knowledge |
| communications | Collaboration | Audiences |
| communications | Environment | Campaign knowledge |
| dissemination | Organization | Products |
| dissemination | Collaboration | Distribution partners |
| treasury | Collaboration | Billing parties |
| treasury | Organization | Priced offerings |
| production | Environment | Schedules and locations |
| production | Collaboration | Vendors |
| product | Organization | Service offerings |
| product | Collaboration | Buyers and suppliers |
| product | Environment | Knowledge |
| service | Organization | Related products |
| service | Collaboration | Service customers |
| service | Environment | Delivery events |
| qualification | Environment | Policies and knowledge |
| qualification | Collaboration | Auditors / partners |
| integrations | Collaboration | Vendor |
| integrations | Organization | Owning faculty |
| locations | Environment | Events / Knowledge / Schedules |
| locations | Organization | Responsible dept |
| events | Environment | Schedule / Knowledge / Location |
| events | Organization | Owning dept |
| knowledge | Environment | Event / Location / Schedule |
| knowledge | Organization | Owning department |
| schedules | Environment | Events / Locations / Knowledge |
| schedules | Organization | Linked tasks |

---

## 6. Relatability Model Proposal

### 6.1 Two relation kinds

A. Structural (ownership): Executive to Policy/Projects/Tasks; Production to Product/Service;
Vendor to Integrations. Child rows carry parent FK via parent_kind + parent_api_name
(already in the record model).

B. Cross-element (relatable): the 40 hints above. Today these are UI-only - no FK,
no join table, no enforcement. Proposal: make them first-class.

### 6.2 record_relations table

    record_relations (
      id, org_id,
      source_type, source_id, source_kind,   -- baked_in | record_type
      target_type, target_id, target_kind,
      relation_kind,                         -- picklist: owns, relates, reports_to, ...
      sort_order, data JSONB, created_at
    )

- Polymorphic addressing (type + id + kind) - same pattern as record parents. No hard FKs to
  typed tables; integrity enforced at the API layer.
- relation_kind comes from a value_set so Stephen can extend relation vocabulary without DDL.
- Bidirectional queries via two indexes (source, target).

### 6.3 Field-level relatability

field_definition.lookup_object_api_name already exists - extend allowed targets to any
recordable element (baked-in or dynamic). A Policy line field Relates-to can point at
Knowledge, a Party, a Project, or any dynamic type.

---

## 7. Proposed ERD (Mermaid)

    ORGANIZATION ||--o{ ELEMENT_CONFIG : has
    ORGANIZATION ||--o{ PARTY : has
    ORGANIZATION ||--o{ RECORD_TYPE : declares
    ORGANIZATION ||--o{ RECORD : contains
    RECORD_TYPE ||--o{ RECORD_FIELD : defines
    RECORD_TYPE ||--o{ RECORD : instantiates
    RECORD ||--o{ RECORD_LINE : has
    RECORD ||--o{ RECORD_RELATION : as_source
    RECORD ||--o{ RECORD_RELATION : as_target
    RECORD }o--o{ RECORD : relates_to
    RECORD }o--o{ CORE_OBJECT : relates_to
    RECORD }o--|| RECORD_TYPE : instance_of
    RECORD_FIELD }o--o| VALUE_SET : picklist
    RECORD_FIELD }o--o| VALUE_SET : relation
    RECORD_RELATION }o--|| VALUE_SET : relation_kind

Notes:
- RECORD parent is polymorphic (parent_kind + parent_api_name) - no hard FK to typed tables.
- Core typed tables (projects, tasks, products, parties, users) stay typed per locked philosophy.
- element_config persists the 7 faculty config forms as singleton records.

---

## 8. Open Questions for Stephen

1. Policy lines fields - title, scope (picklist), owner (lookup to User), summary. Add
   Effective date / Review date / Version? (Recommended: yes - policies need lifecycle.)
2. Treasury lines - Accounts, Transactions, Budgets as three lines groups, or one generic
   Treasury-lines group with a Type field?
3. Party lines - shared Contacts lines group across all four parties, or per-party fields?
4. Dissemination Channels - first-class element (own tab + config) or lines group?
5. record_relations - build in Horizon 1, or defer to Horizon 2?

---

## 9. Next Steps

1. Stephen reviews section 4 (lines candidates), 6 (relatability), 7 (ERD) - confirm or adjust.
2. Lock built-in element definitions as Horizon 1 seed data.
3. Horizon 1 proceeds: persist catalog tables (value_set, field_definition, layout_definition,
   record_types, records, record_lines, record_relations) + built-in element seed.
4. Web-dev resumes dynamic-records slices on the locked schema.
