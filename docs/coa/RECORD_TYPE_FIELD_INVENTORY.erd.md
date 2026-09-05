# Mission Control — record-type ERD (inventory review)

**Date:** 2026-09-05  
**Source:** inventory as coded + Stephen locks (including 17:36 EDT feedback).  
**Sign-off:** this file. Seed pack **0.7.133** matches this picture. `migrate_agi_org` still waits.

Solid names = in the catalog today. Fields listed here are the seeded set.

Collaboration Vendor path: **Collaboration / Vendor / {Credentials | Integrations | Exchange}**.

Preview this markdown so the mermaid renders.

## Faculty (definition)

**Faculty** here is not a university. It is an **internal function of the Organization** — a capacity the business uses to operate — as opposed to a **collaboration party** (vendor, customer, partner, branch) or **environment** (locations, events, knowledge, schedules).

The Organization ring is the set of faculties: Executive, Communications, Dissemination, Treasury, Production, Qualification, Distribution (Public). Record types that hang under those tabs use `parent_kind: faculty` in code. A Service is “a faculty through which results are achieved” (e.g. bookkeeping): the same word, a function, not a person.

Operators see the tab names (Executive, Production, …). `faculty` is the Records Editor parent-kind token. We can rename that token to `organization` later if you want the word gone from the editor.

---

## One set of names (locked 2026-09-05)

**Yes — one business object each.** Keep the zone record types. Do **not** keep a second set called `project`, `task`, `product`, or `service`.

| Canonical (keep) | Fold into it, then retire the name |
|------------------|------------------------------------|
| `executive_project` | typed core `project` (`/api/projects`, `/projects`) |
| `executive_task` | typed core `task` (`/api/tasks`, `/tasks`) |
| `production_product` | typed core `product` (`/api/public/products`, `/products`) |
| `production_service` | (no typed-core twin) |
| `organization` | already one table |

Take useful fields from the old cores (priority, dates, tagline, …) onto the canonical types. Person fields stay **staff** lookups. Anything still using the short names is a **rename/refactor**, not a second schema. `organization` and `user` stay typed cores; they are not in that duplicate set.

---

## Platform fields on every record type

```mermaid
erDiagram
    user ||--o{ RecordInstance : "created_by"
    user ||--o{ RecordInstance : "last_modified_by"
    communication_staff ||--o{ contact : "vv_connection_uid is not a lookup"

    RecordInstance {
        lookup created_by "user system-set"
        lookup last_modified_by "user system-set"
        datetime created_at
        datetime updated_at
    }

    user {
        email email
        text name
        picklist type "human agent"
        picklist role
        picklist status
    }
```

`created_by` / `last_modified_by` are system-maintained lookups to **user** (the signed-in operator or agent account). They are not staff lookups.

`vv_connection_uid` is **not** on every table. It is a VersaVoice uid **text** on staff and contacts only — a pointer into the host Connections cache, not a local FK.

---

## 1. Spine — Primary Org, parties, staff

```mermaid
erDiagram
    organization ||--o{ organization : "parent_organization_id"
    organization ||--o{ location : "organization_id"
    organization ||--o{ contact : "organization_id"
    organization ||--o{ communication_staff : "organization_id"
    organization ||--o{ treasury_transaction : "counterparty_organization_id"
    user }o--o| department : "department_id"
    communication_staff ||--o{ executive_policy : "owner_id"
    communication_staff ||--o{ executive_project : "owner_id"
    communication_staff ||--o{ executive_task : "assignee_id"

    organization {
        text name
        picklist org_type "internal vendor customer partner branch"
        boolean is_person
        text slug
        boolean is_active
        url logo_url
        long_text notes
        text external_id
        lookup created_by
        lookup last_modified_by
    }

    location {
        text name
        long_text address
        text line_1
        text line_2
        text city
        text state
        text postal_code
        text country
        boolean is_primary
        picklist status
        text external_id
    }

    contact {
        text name
        picklist contact_kind "staff public"
        email email
        phone phone
        text organization_name
        text vv_connection_uid
        text external_id
    }

    communication_staff {
        text name
        picklist role "staff_role value set"
        picklist status
        text vv_connection_uid
        text external_id
    }
```

Person fields on the Org schema (owner, assignee, and any other “who”) look up **`communication_staff`**. Login identity stays on **user**.

---

## 2. Faculty record types

```mermaid
erDiagram
    communication_staff ||--o{ executive_policy : "owner_id"
    communication_staff ||--o{ executive_project : "owner_id"
    communication_staff ||--o{ executive_task : "assignee_id"

    executive_policy {
        text name
        lookup owner_id "communication_staff"
        picklist status "draft active archived"
        text title "line"
        long_text body "line"
        boolean render_as_html "line WYSIWYG vs text"
    }

    executive_project {
        text name
        picklist status
        picklist priority
        lookup owner_id "communication_staff"
        date start_date
        date target_date
        long_text description
        text external_id
        text milestone_title
        date milestone_date
    }

    executive_task {
        text name
        picklist status
        picklist priority
        lookup assignee_id "communication_staff"
        date due_date
        long_text notes
        text subtask_title
        boolean subtask_done
    }

    production_product {
        text name
        text tagline
        picklist category
        long_text description
        long_text features
        text status
        text sku
        text external_id
        text variant_name
        currency variant_price
    }

    production_service {
        text name
        picklist status
        long_text description
        text rate_item
        currency rate_amount
    }

    communication_message {
        text name
        picklist message_type
        picklist status
        long_text notes
    }

    communication_report {
        text name
        picklist status
        long_text summary
        long_text notes
    }

    dissemination_sales {
        text name
        picklist status
        long_text description
        long_text notes
    }

    dissemination_promotion_marketing {
        text name
        picklist status
        long_text description
        long_text notes
    }

    qualification_examination {
        text name
        picklist status
        long_text notes
    }

    qualification_review {
        text name
        picklist status
        long_text notes
    }

    qualification_certifications_awards {
        text name
        picklist status
        long_text notes
    }
```

Policy: `scope` and `summary` removed. Lines are `title` + `body`. `render_as_html` on the line chooses a WYSIWYG (HTML) editor vs plain text for that `body`. Status is a picklist (`draft | active | archived`).

---

## 3. Environment

```mermaid
erDiagram
    event {
        text name
        picklist kind
        picklist status
        long_text description
    }

    schedule {
        text name
        picklist kind "one-time recurring"
        number interval_count "when recurring"
        picklist interval_unit "minute hour day week month year"
        text interval_iso "P1W stored ISO-8601"
        picklist status
        long_text notes
    }

    knowledge {
        text name
        picklist kind
        picklist status
        long_text summary
        file file
    }

    environment_stat {
        text name
        number value
        text unit
        text category
        picklist scale
        long_text series
        picklist status
    }
```

### Schedule interval (recommendation)

Postgres `INTERVAL` is a good **storage** type on a typed table. It is a poor **widget**: strings like `2 days 03:00:00` are unfriendly, and fixture JSON cannot native-interval anyway.

Proposed catalog shape:

- Widget: number + unit (`every [2] [weeks]`), shown when `kind=recurring`.
- Stored as ISO 8601 duration in instance JSON (`P2W`, `PT15M`) — portable, standard, queryable.
- Optional later: a generated Postgres `interval` column parsed from `interval_iso` for SQL date math.

That is enough for “every N minutes/hours/days/weeks/months/years”. Calendar RRULE (“second Tuesday”) is a separate later field if you need it; do not overload interval for that.

---

## 4. Treasury — this is the transaction table

`treasury_transaction` **is** Mission Control’s transaction table (AGi `transactions` + quote/estimate/invoice as kinds).

```mermaid
erDiagram
    organization ||--o{ treasury_transaction : "counterparty_organization_id"
    treasury_transaction ||--o| treasury_transaction : "converted_from_id"

    treasury_transaction {
        text name
        picklist document_kind "transaction quote estimate invoice"
        picklist classification "income disbursement"
        currency amount
        text currency
        date transaction_date
        text category
        picklist status
        long_text notes
        text external_id
        lookup converted_from_id
        lookup created_by
        lookup last_modified_by
    }

    treasury_records_assets_materiel {
        text name
        picklist status
        long_text description
        long_text notes
        file file
    }
```

---

## 5. Collaboration / Vendor / {sub-tab}

Sub-tabs under Vendor: **Credentials**, **Integrations**, **Exchange**.

Today Integrations are org-attached lines. After seed they become a record type so the other two can look them up.

```mermaid
erDiagram
    organization ||--o{ vendor_credential : "organization_id"
    organization ||--o{ vendor_integration : "organization_id"
    vendor_credential ||--o{ vendor_integration : "credential_id"
    vendor_integration ||--o{ vendor_exchange : "integration_id"
    organization ||--o{ vendor_exchange : "source_organization_id"
    organization ||--o{ vendor_exchange : "target_organization_id"

    vendor_credential {
        text name
        picklist auth_type "api_key oauth2 basic smtp custom"
        long_text configuration
        long_text notes
        text external_id
    }

    vendor_integration {
        text name
        picklist kind
        picklist status
        long_text notes
        text external_id
    }

    vendor_exchange {
        text name
        picklist origin "inbound outbound"
        picklist status "pending ok error"
        text source_table
        text source_id
        long_text payload
        boolean replicate
        long_text error_message
        text external_id
    }
```

---

## 6. File field type

```mermaid
erDiagram
    FieldDefinition ||--o| FileValue : "data_type file"

    FieldDefinition {
        text api_name
        text data_type
    }

    FileValue {
        picklist storage "blob url"
        picklist mime_type "file_mime value set"
        text url
        text blob_ref
    }
```

---

## 7. Fold / rename (not a second ERD)

When seeding, retire catalog objects `project`, `task`, `product`. Point `/api/projects`, `/projects`, public product listings, and nav at `executive_project` / `executive_task` / `production_product`. Drop `task_count` (derive from related tasks). Drop `owner_name` / `assignee_name` (staff lookups).

`user`, `organization`, and `department` stay. They were never the duplicate set.

---

## Catalog parents (containers)

Faculty: `executive`, `communications`, `dissemination`, `production`, `qualification`, `treasury`, `public`.  
Collaboration: `vendor`, `customer`, `partner`, `branch`.
