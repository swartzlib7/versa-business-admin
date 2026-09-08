## AGi Org foundation → Mission Control mapping

**Source excerpt:** `docs/_notes/_exerpt_(state_org_foundation).md` (AGi ERD v13 + SQLite cents rules).  
**Visual review:** `RECORD_TYPE_FIELD_INVENTORY.erd.md` (mermaid). Org-party migrate is `scripts/migrate_agi_org.mjs`.

**MC honors:** one Primary Org (`org_type=internal` + `is_primary`); additional own businesses are also Org (`internal`, not Primary). Collaboration parties are vendor | customer | partner | branch (subsidiary). Production owns Product/Service; Executive owns Policy/Projects/Tasks; Treasury owns transactions (including quote / estimate / invoice kinds); Environment Locations hold structured addresses.

Users are human|agent. **`vv_connection_uid` is a VersaVoice pointer** on staff and contacts, not an imported `connections` cache. Org-schema person fields (owner, assignee) look up **staff**. `created_by` / `last_modified_by` look up **user** and are system-set on every record.

Wave Customer/Vendor maps to `organizations` via `external_id`. After a live migrate, **disable the built-in AGi Org module** so both catalogs do not own the same parties.

Money: AGi stores **integer cents**. MC `currency` fields are decimal display strings (sample pack uses `"150.00"`). Migration must convert cents → decimal per currency and **never SUM across currencies**.

**One name set (locked):** `executive_project`, `executive_task`, `production_product`, `production_service`. Do not keep a second set called `project`, `task`, `product`, or `service`. Fold old typed-core fields into the canonical types, then rename/refactor callers. `organization` and `user` stay typed cores.

### Mapped (vanilla fields in this inventory)

| AGi | MC zone / type | Fields taken |
|-----|----------------|--------------|
| `organizations` | Executive `organization` (typed core) | name, slug, `type` → `org_type` picklist, notes, `logo_path` → `logo_url`, `external_id`, `is_active`. |
| `physical_addresses` + `org_addresses` | Environment `location` | line_1, line_2, city, state, postal_code, country, is_primary, `external_id`, `organization_id`. Keep `address` as combined long_text. |
| `email_addresses` + `org_emails` | Public `contact` | email, phone, name, `organization_id`, **`vv_connection_uid`**. Do not copy AGi email credentials onto the contact. |
| `org_staff` | Communications `communication_staff` | name, **`role` picklist**, `organization_id`, **`vv_connection_uid`**. |
| `products` | Production `production_product` | name, description, sku, `external_id`. `unit_price_cents` → line `variant_price` (/100). |
| `transactions` + invoice/estimate as **kinds** | Treasury `treasury_transaction` (**the** MC transaction table) | amount, currency, category, date, counterparty, `external_id`, classification income\|disbursement, **`document_kind`**: transaction \| quote \| estimate \| invoice. |

### Locked 2026-09-05 (Stephen) — proposed until sign-off, then seed

| AGi / need | MC | Notes |
|------------|----|--------|
| Invoice / estimate / quote | **Not separate record types.** `treasury_transaction.document_kind` = `transaction` \| `quote` \| `estimate` \| `invoice`. Optional `converted_from_id`. |
| `org_staff.connection_uid` | `communication_staff.vv_connection_uid` + `contact.vv_connection_uid` | Text pointer to VersaVoice. Not on every table. |
| Person fields (owner, assignee) | lookup → `communication_staff` | Org schema. Login audit fields look up `user`. |
| Audit | `created_by`, `last_modified_by` | Every record type. Lookup → user. System-set. |
| `credentials` | Collaboration / Vendor / **Credentials** (`vendor_credential`) | Lookup from Integration records. |
| Vendor integrations (today org **lines**) | Collaboration / Vendor / **Integrations** (`vendor_integration`) | Elevate from `line_group=integrations`. Lookup → credential. |
| `exchange` | Collaboration / Vendor / **Exchange** (`vendor_exchange`) | I/O table. Lookup → parent integration. |
| File values | catalog `data_type=file` | Mime value set + storage `blob` \| `url`. |
| Policy lines | `title`, `body`, `render_as_html` | Drop `scope` and `summary`. Status picklist. Owner → staff. |
| Schedule | `interval_count` + `interval_unit` → `interval_iso` | Widget, not raw Postgres interval in the UI. |
| Staff role | picklist `staff_role` | Replace free-text `role`. |
| Duplicate cores | Fold `project`/`task`/`product` into `executive_project`/`executive_task`/`production_product` | Take priority, dates, tagline, features. Retire the short names. |

### File field type (catalog, not a record type)

| Piece | api / enum | Notes |
|-------|------------|--------|
| data_type | `file` | Alongside text, lookup, currency, … |
| storage | `blob` \| `url` | Blob = bytes in MC storage; url = path or https. |
| mime_type | value set `file_mime` | Start: pdf, png, jpeg, webp, gif, plain, csv, json, zip. Operators may extend. |
| url | text | Required when storage=url. |
| blob_ref | text | Opaque store key when storage=blob. Never put raw bytes in instance JSON. |

### Proposed record types (seeded — 0.7.133+; treasury lines 0.7.147)

#### vendor_credential — Credentials — Collaboration / Vendor / Credentials

| Field | api_name | Type |
|-------|----------|------|
| Name | name | text |
| Auth type | auth_type | picklist (`api_key`, `oauth2`, `basic`, `smtp`, `custom`) |
| Configuration | configuration | long_text (encrypted; never log) |
| Notes | notes | long_text |
| Vendor | organization_id | lookup → organization (vendor) |
| External id | external_id | text |

#### vendor_integration — Integrations — Collaboration / Vendor / Integrations

Today org-attached **lines**. After sign-off a record type so Credentials and Exchange can look it up.

| Field | api_name | Type |
|-------|----------|------|
| Name | name | text |
| Kind | kind | picklist `integration_kind` |
| Status | status | picklist `integration_status` |
| Notes | notes | long_text |
| Vendor | organization_id | lookup → organization |
| Credential | credential_id | lookup → vendor_credential |
| External id | external_id | text |

#### vendor_exchange — Exchange — Collaboration / Vendor / Exchange

| Field | api_name | Type |
|-------|----------|------|
| Name | name | text |
| Status | status | picklist (`pending`, `ok`, `error`) |
| Origin | origin | picklist (`inbound`, `outbound`) |
| Source table | source_table | text |
| Source id | source_id | text |
| Payload | payload | long_text |
| Replicate | replicate | boolean |
| Error | error_message | long_text |
| Integration | integration_id | lookup → vendor_integration |
| Source org | source_organization_id | lookup → organization |
| Target org | target_organization_id | lookup → organization |
| External id | external_id | text |

#### treasury_transaction — extra fields (this **is** the MC transaction table)

| Field | api_name | Type |
|-------|----------|------|
| Document kind | document_kind | picklist: transaction, quote, estimate, invoice |
| Converted from | converted_from_id | lookup → treasury_transaction |

#### Every record type — audit (system)

| Field | api_name | Type |
|-------|----------|------|
| Created by | created_by | lookup → user |
| Last modified by | last_modified_by | lookup → user |

#### executive_policy — vanilla after feedback

Drop `scope`, `summary`. Header: `name`, `owner_id` (lookup staff), `status` picklist (`draft` \| `active` \| `archived`). Lines: `title`, `body`, `render_as_html` (boolean — WYSIWYG HTML vs plain text).

#### communication_staff.role

Picklist value set `staff_role` (extendable): `executive`, `operations`, `finance`, `production`, `communications`, `sales`, `support`, `other`.

#### schedule.interval

Widget: count + unit (`every 2 weeks`). Stored as ISO 8601 duration (`interval_iso`, e.g. `P2W`). Postgres `INTERVAL` may back a generated column later; it is not the control the operator sees. RRULE (“second Tuesday”) stays a later field.

### Migration (script + skill — after ERD sign-off)

Do **not** disable host Organization on this development instance. Full-entity writers live in `scripts/migrate_agi_org.mjs` (0.7.148): require `--primary-source-org-id`, copy credential configuration (never print it). See `docs/production/state/state_migrate_agi_org.md`.

A user-run script reads AGi Org through `agictl organization` and writes VBA organizations + records using `external_id` for idempotency. Sample rows use prefix `ba_sample:` and are **not** the migrator.

Operator steps after a successful migrate:

1. Confirm Primary Org is the single `internal` row; AGi extra “internal” orgs become `branch` or merge.
2. Disable the built-in AGi Org module so Mission Control is the system of record.
3. Do not run Insert Sample Data on a migrated host unless you want extra `ba_sample:` rows.
