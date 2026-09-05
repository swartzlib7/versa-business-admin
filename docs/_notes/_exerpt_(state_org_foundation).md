# State: Organization — Foundation & UI (intermediate record)

### 2.3 Schema ERD (v13)

> **Note:** `connections` in this ERD is illustrative — live cache is `tasks.db.connections` (synced from VV; no `email`/`phone` columns; includes `spoken_lang`, `country`, `profile_synced_at`, etc.). Org staff links via `org_staff.connection_uid` → that cache.

```mermaid
erDiagram
    connections {
        text uid PK
        text display_name
        text email
        text phone
    }
    organizations {
        int id PK
        text name
        text slug UK
        text type
        text notes
        text logo_path
        text external_id
        bool is_active
        datetime created_at
        datetime updated_at
    }
    credentials {
        int id PK
        text name
        text auth_type
        text configuration
        text notes
        datetime created_at
        datetime updated_at
    }
    email_addresses {
        int id PK
        text email UK
        text label
        bool is_primary
        text usage_notes
        int credential_id FK
    }
    physical_addresses {
        int id PK
        text line_1
        text line_2
        text city
        text state
        text postal_code
        text country
        text label
        bool is_primary
    }
    picklists {
        int id PK
        text name
        text value
        text table_name
        text field_name
        int position
        datetime created_at
    }
    products {
        int id PK
        int org_id FK
        text name
        text description
        text type
        text sku
        int unit_price_cents
        text currency
        bool is_active
        text external_id
        datetime created_at
        datetime updated_at
    }
    invoices {
        int id PK
        int org_id FK
        int customer_org_id FK
        text invoice_number
        text status
        int subtotal_cents
        int tax_total_cents
        int total_cents
        text currency
        date issue_date
        date due_date
        date paid_date
        text notes
        text external_id
        datetime created_at
        datetime updated_at
    }
    invoice_line_items {
        int id PK
        int invoice_id FK
        int product_id FK
        text description
        real quantity
        int unit_price_cents
        int total_cents
        datetime created_at
    }
    estimates {
        int id PK
        int org_id FK
        int customer_org_id FK
        text estimate_number
        text status
        int subtotal_cents
        int tax_total_cents
        int total_cents
        text currency
        date issue_date
        date expiry_date
        text notes
        text external_id
        int converted_to_invoice_id FK
        datetime created_at
        datetime updated_at
    }
    estimate_line_items {
        int id PK
        int estimate_id FK
        int product_id FK
        text description
        real quantity
        int unit_price_cents
        int total_cents
        datetime created_at
    }
    transactions {
        int id PK
        int org_id FK
        int counterparty_org_id FK
        text account_name
        date transaction_date
        text description
        int amount_cents
        text currency
        text category
        text external_id
        datetime created_at
        datetime updated_at
    }
    exchange {
        int id PK
        text name
        text source_table
        int source_id
        text external_id
        int source_org_id FK
        int target_org_id FK
        text origin
        text status
        bool replicate
        text error_message
        datetime created_at
        datetime updated_at
    }
    org_staff {
        int id PK
        int org_id FK
        text connection_uid FK
        datetime created_at
    }
    org_emails {
        int id PK
        int org_id FK
        int email_id FK
    }
    org_addresses {
        int id PK
        int org_id FK
        int address_id FK
    }
    org_staff_addresses {
        int id PK
        int org_staff_id FK
        int address_id FK
    }
    organizations ||--o{ products : offers
    organizations ||--o{ invoices : issues
    organizations ||--o{ invoices : billed_on
    invoices ||--o{ invoice_line_items : contains
    products ||--o{ invoice_line_items : referenced_by
    organizations ||--o{ estimates : issues
    organizations ||--o{ estimates : quoted_on
    estimates ||--o{ estimate_line_items : contains
    products ||--o{ estimate_line_items : referenced_by
    estimates ||--o| invoices : converts_to
    organizations ||--o{ transactions : has
    organizations ||--o{ transactions : counterparty_on
    organizations ||--o{ org_staff : has
    connections ||--o{ org_staff : belongs_to
    organizations ||--o{ org_emails : has
    email_addresses ||--o{ org_emails : linked_to
    credentials ||--o{ email_addresses : authenticates
    organizations ||--o{ org_addresses : has
    physical_addresses ||--o{ org_addresses : linked_to
    org_staff ||--o{ org_staff_addresses : has
    physical_addresses ||--o{ org_staff_addresses : linked_to
    organizations ||--o{ exchange : source_org
    organizations ||--o{ exchange : target_org
```

Customer/vendor dynamic; Wave maps Customer/Vendor → `organizations` via `external_id`. Full narrative: archive §3.

### 2.4 SQLite standards (summary)

Full text: archive **§9**. Locked rules: cents not float; never SUM across currencies; STRICT; FK ON every connection; WAL at init; busy_timeout 5000; writer `updated_at`; shared `_connect` helper. Historic gap: FK enforcement on older DBs → hub **ORG-D5**. Rounding half-up vs banker's → open for connector/STEWART math.
