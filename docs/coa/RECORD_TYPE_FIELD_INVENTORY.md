# Mission Control — record-type field inventory (vanilla defaults review)

**Date:** 2026-09-05  
**Source:** generated from the code as it stands (beta working tree): `src/lib/fixtures/record-types.ts` + `src/lib/fixtures/catalog.ts`. Generator: `workspace/AGi-Tools/build_record_type_inventory.py`. Mapping: `RECORD_TYPE_FIELD_INVENTORY.agi.md`. **ERD (visual review):** `RECORD_TYPE_FIELD_INVENTORY.erd.md`.

**Purpose:** your review checklist. For each record type: its zone, structure, and the exact default field set the code gives it today. Decide per type what the vanilla set should be; anything you change here becomes the refinement work list.

**Note:** these field definitions are the session-layer catalog (see REMAINING_WORK.md validation) — this inventory reflects what the product actually serves today, not aspirations.

Faculty / collaboration **containers** (`executive`, `dissemination`, `production`, and the rest with `show_as_tab: false` and no fields) are **not** record tabs in the UI. They stay in code as Records Editor parents. They are listed in an appendix, not in the summary table.

## Summary — 25 record types

| Zone | Record type | Label | Structure | Fields defined |
|------|-------------|-------|-----------|----------------|
| communications | communication_message | Messages | list | 6 |
| communications | communication_report | Reports | list | 6 |
| communications | communication_staff | Staff | list | 9 |
| dissemination | dissemination_promotion_marketing | Promotion & Marketing | list | 6 |
| dissemination | dissemination_sales | Sales | list | 6 |
| events | event | Events | list | 6 |
| executive | executive_policy | Policies | header_lines | 13 |
| executive | executive_project | Projects | header_lines | 13 |
| executive | executive_task | Tasks | header_lines | 11 |
| executive | organization | Organization | list | 11 |
| knowledge | knowledge | Knowledge | list | 7 |
| locations | location | Locations | list | 15 |
| production | production_product | Products | header_lines | 12 |
| production | production_service | Services | header_lines | 7 |
| public | contact | Contacts | list | 11 |
| qualification | qualification_certifications_awards | Certifications & Awards | list | 5 |
| qualification | qualification_examination | Examinations | list | 5 |
| qualification | qualification_review | Reviews | list | 5 |
| schedules | schedule | Schedules | list | 9 |
| stats | environment_stat | Stats | list | 9 |
| treasury | treasury_records_assets_materiel | Records, Assets and Materiel | list | 7 |
| treasury | treasury_transaction | Transactions | list | 14 |
| vendor | vendor_credential | Credentials | list | 8 |
| vendor | vendor_exchange | Exchange | list | 14 |
| vendor | vendor_integration | Integrations | list | 9 |

**Record types with no fields at all:** none

## Per-zone detail

### Zone: communications

#### communication_message — Messages (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Message subject | name | text | yes | system |  |
| 4 | Message type | message_type | picklist |  | system | value set: message_type (call, email, letter, meeting, social) |
| 5 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 6 | Notes | notes | long_text |  | system |  |


#### communication_report — Reports (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Report title | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Summary | summary | long_text |  | system |  |
| 6 | Notes | notes | long_text |  | system |  |


#### communication_staff — Staff (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Staff member | name | text | yes | system |  |
| 4 | Role | role | picklist |  | system | value set: staff_role (communications, executive, finance, operations, other, production, sales, support) |
| 5 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 6 | Notes | notes | long_text |  | system |  |
| 7 | Organization | organization_id | lookup |  | system | lookup -> organization |
| 8 | External id | external_id | text |  | system |  |
| 9 | VersaVoice connection uid | vv_connection_uid | text |  | system |  |


### Zone: dissemination

#### dissemination_promotion_marketing — Promotion & Marketing (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Campaign name | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Description | description | long_text |  | system |  |
| 6 | Notes | notes | long_text |  | system |  |


#### dissemination_sales — Sales (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Sales item | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Description | description | long_text |  | system |  |
| 6 | Notes | notes | long_text |  | system |  |


### Zone: events

#### event — Events (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Title | name | text | yes | system |  |
| 4 | Kind | kind | picklist |  | system | value set: event_kind (launch, maintenance, meeting, other) |
| 5 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 6 | Description | description | long_text |  | system |  |


### Zone: executive

#### executive_policy — Policies (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  |  | system | lookup -> user |
| 3 | Policy title | name | text | header | yes | system |  |
| 4 | Scope | scope | picklist | header |  | system; hidden | value set: policy_scope (compliance, department, organization, product) |
| 5 | Owner (text) | owner | text | header |  | system; hidden |  |
| 6 | Owner | owner_id | lookup | header |  | system | lookup -> communication_staff |
| 7 | Summary | summary | long_text | header |  | system; hidden |  |
| 8 | Line title | line_title | text | line |  | system; hidden |  |
| 9 | Title | title | text | line |  | system |  |
| 10 | Status | status | picklist | header |  | system | value set: policy_status (active, archived, draft); default: draft |
| 11 | Line notes | line_notes | long_text | line |  | system; hidden |  |
| 12 | Body | body | long_text | line |  | system |  |
| 13 | Render as HTML | render_as_html | boolean | line |  | system | default: false |


#### executive_project — Projects (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  |  | system | lookup -> user |
| 3 | Project name | name | text | header | yes | system |  |
| 4 | Status | status | picklist | header |  | system | value set: zone_project_status (active, blocked, done, planned) |
| 5 | Owner (text) | owner | text | header |  | system; hidden |  |
| 6 | Owner | owner_id | lookup | header |  | system | lookup -> communication_staff |
| 7 | Priority | priority | picklist | header |  | system | value set: project_priority (high, low, normal); default: normal |
| 8 | Start date | start_date | date | header |  | system |  |
| 9 | Target date | target_date | date | header |  | system |  |
| 10 | Description | description | long_text | header |  | system |  |
| 11 | External id | external_id | text | header |  | system |  |
| 12 | Milestone title | milestone_title | text | line |  | system |  |
| 13 | Milestone date | milestone_date | date | line |  | system |  |


#### executive_task — Tasks (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  |  | system | lookup -> user |
| 3 | Task title | name | text | header | yes | system |  |
| 4 | Status | status | picklist | header |  | system | value set: zone_task_status (done, in_progress, todo, waiting) |
| 5 | Assignee (text) | assignee | text | header |  | system; hidden |  |
| 6 | Assignee | assignee_id | lookup | header |  | system | lookup -> communication_staff |
| 7 | Priority | priority | picklist | header |  | system | value set: task_priority (high, low, normal, urgent); default: normal |
| 8 | Due date | due_date | date | header |  | system |  |
| 9 | Notes | notes | long_text | header |  | system |  |
| 10 | Subtask title | subtask_title | text | line |  | system |  |
| 11 | Subtask done | subtask_done | boolean | line |  | system |  |


#### organization — Organization (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Organization type | org_type | picklist |  | system | value set: org_type (branch, customer, internal, partner, vendor); default: internal |
| 5 | Person organization | is_person | boolean |  | system |  |
| 6 | Parent organization | parent_organization_id | lookup |  | system | lookup -> organization |
| 7 | Slug | slug | text |  | system |  |
| 8 | Active | is_active | boolean |  | system | default: true |
| 9 | Logo | logo_url | url |  | system |  |
| 10 | Notes | notes | long_text |  | system |  |
| 11 | External id | external_id | text |  | system |  |


### Zone: knowledge

#### knowledge — Knowledge (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Title | name | text | yes | system |  |
| 4 | Asset type | kind | picklist |  | system | value set: knowledge_kind (document, photo, policy, recording, research) |
| 5 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 6 | Summary | summary | long_text |  | system |  |
| 7 | File | file | file |  | system | value set: file_mime (application/json, application/pdf, application/zip, image/gif, image/jpeg, image/png, image/webp, text/csv, text/plain) |


### Zone: locations

#### location — Locations (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Label | name | text | yes | system |  |
| 4 | Address | address | long_text |  | system |  |
| 5 | Country | country | text |  | system |  |
| 6 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 7 | Notes | notes | long_text |  | system |  |
| 8 | Address line 1 | line_1 | text |  | system |  |
| 9 | Address line 2 | line_2 | text |  | system |  |
| 10 | City | city | text |  | system |  |
| 11 | State | state | text |  | system |  |
| 12 | Postal code | postal_code | text |  | system |  |
| 13 | Primary address | is_primary | boolean |  | system |  |
| 14 | Organization | organization_id | lookup |  | system | lookup -> organization |
| 15 | External id | external_id | text |  | system |  |


### Zone: production

#### production_product — Products (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  |  | system | lookup -> user |
| 3 | Name | name | text | header | yes | system |  |
| 4 | Tagline | tagline | text | header |  | system |  |
| 5 | Category | category | picklist | header |  | system | value set: product_category (device, file, manufactured, software) |
| 6 | Description | description | long_text | header |  | system |  |
| 7 | Features | features | long_text | header |  | system |  |
| 8 | Status | status | text | header |  | system |  |
| 9 | Variant name | variant_name | text | line |  | system |  |
| 10 | Variant price | variant_price | currency | line |  | system |  |
| 11 | SKU | sku | text | header |  | system |  |
| 12 | External id | external_id | text | header |  | system |  |


#### production_service — Services (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  |  | system | lookup -> user |
| 3 | Name | name | text | header | yes | system |  |
| 4 | Status | status | picklist | header |  | system | value set: service_status (active, connected, standby) |
| 5 | Description | description | long_text | header |  | system |  |
| 6 | Rate item | rate_item | text | line |  | system |  |
| 7 | Rate amount | rate_amount | currency | line |  | system |  |


### Zone: public

#### contact — Contacts (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Contact name | name | text | yes | system |  |
| 4 | Contact kind | contact_kind | picklist |  | system | value set: contact_kind (public, staff) |
| 5 | Email | email | email |  | system |  |
| 6 | Phone | phone | phone |  | system |  |
| 7 | Organization name | organization | text |  | system |  |
| 8 | Organization | organization_id | lookup |  | system | lookup -> organization |
| 9 | External id | external_id | text |  | system |  |
| 10 | VersaVoice connection uid | vv_connection_uid | text |  | system |  |
| 11 | Notes | notes | long_text |  | system |  |


### Zone: qualification

#### qualification_certifications_awards — Certifications & Awards (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Certification or award | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Notes | notes | long_text |  | system |  |


#### qualification_examination — Examinations (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Examination | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Notes | notes | long_text |  | system |  |


#### qualification_review — Reviews (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Review | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Notes | notes | long_text |  | system |  |


### Zone: schedules

#### schedule — Schedules (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Label | name | text | yes | system |  |
| 4 | Kind | kind | picklist |  | system | value set: schedule_kind (one-time, recurring) |
| 5 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 6 | Notes | notes | long_text |  | system |  |
| 7 | Interval count | interval_count | number |  | system |  |
| 8 | Interval unit | interval_unit | picklist |  | system | value set: interval_unit (day, hour, minute, month, week, year); default: week |
| 9 | Interval (ISO 8601) | interval_iso | text |  | system |  |


### Zone: stats

#### environment_stat — Stats (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Value | value | number |  | system |  |
| 5 | Unit | unit | text |  | system |  |
| 6 | Category | category | text |  | system |  |
| 7 | Scale | scale | picklist |  | system | value set: stat_scale (custom, day, hour, month, week, year); default: month |
| 8 | Series | series | long_text |  | system |  |
| 9 | Status | status | picklist |  | system | value set: record_status (active, archived) |


### Zone: treasury

#### treasury_records_assets_materiel — Records, Assets and Materiel (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Item | name | text | yes | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Description | description | long_text |  | system |  |
| 6 | Notes | notes | long_text |  | system |  |
| 7 | File | file | file |  | system | value set: file_mime (application/json, application/pdf, application/zip, image/gif, image/jpeg, image/png, image/webp, text/csv, text/plain) |


#### treasury_transaction — Transactions (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Transaction | name | text | yes | system |  |
| 4 | Document kind | document_kind | picklist |  | system | value set: document_kind (estimate, invoice, quote, transaction); default: transaction |
| 5 | Classification | classification | picklist |  | system | value set: treasury_transaction_classification (disbursement, income) |
| 6 | Converted from | converted_from_id | lookup |  | system | lookup -> treasury_transaction |
| 7 | Amount | amount | currency |  | system |  |
| 8 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 9 | Notes | notes | long_text |  | system |  |
| 10 | Currency | currency | text |  | system | default: USD |
| 11 | Date | transaction_date | date |  | system |  |
| 12 | Category | category | text |  | system |  |
| 13 | Counterparty | counterparty_organization_id | lookup |  | system | lookup -> organization |
| 14 | External id | external_id | text |  | system |  |


### Zone: vendor

#### vendor_credential — Credentials (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Auth type | auth_type | picklist |  | system | value set: credential_auth_type (api_key, basic, custom, oauth2, smtp) |
| 5 | Vendor | organization_id | lookup |  | system | lookup -> organization |
| 6 | Configuration | configuration | long_text |  | system |  |
| 7 | Notes | notes | long_text |  | system |  |
| 8 | External id | external_id | text |  | system |  |


#### vendor_exchange — Exchange (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Origin | origin | picklist |  | system | value set: exchange_origin (inbound, outbound) |
| 5 | Status | status | picklist |  | system | value set: exchange_status (error, ok, pending) |
| 6 | Integration | integration_id | lookup |  | system | lookup -> vendor_integration |
| 7 | Source organization | source_organization_id | lookup |  | system | lookup -> organization |
| 8 | Target organization | target_organization_id | lookup |  | system | lookup -> organization |
| 9 | Source table | source_table | text |  | system |  |
| 10 | Source id | source_id | text |  | system |  |
| 11 | Payload | payload | long_text |  | system |  |
| 12 | Replicate | replicate | boolean |  | system | default: false |
| 13 | Error message | error_message | long_text |  | system |  |
| 14 | External id | external_id | text |  | system |  |


#### vendor_integration — Integrations (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Kind | kind | picklist |  | system | value set: integration_kind (api, manual, other, sftp, webhook) |
| 5 | Status | status | picklist |  | system | value set: integration_status (active, connected, error, standby) |
| 6 | Vendor | organization_id | lookup |  | system | lookup -> organization |
| 7 | Credential | credential_id | lookup |  | system | lookup -> vendor_credential |
| 8 | Notes | notes | long_text |  | system |  |
| 9 | External id | external_id | text |  | system |  |


## Catalog parents (not record tabs)

These rows exist so Fields / Lookup / Layouts can target a faculty or collaboration party. They do **not** appear as record tabs in the dashboard.

| Zone | api_name | Label |
|------|----------|-------|
| branch | branch | Branch |
| communications | communications | Communications |
| customer | customer | Customer |
| dissemination | dissemination | Dissemination |
| executive | executive | Executive |
| partner | partner | Partner |
| production | production | Production |
| public | public | Distribution |
| qualification | qualification | Qualification |
| treasury | treasury | Treasury |
| vendor | vendor | Vendor |

## First-class objects (typed tables, not record types)


### department

_No default fields defined in the catalog fixture for this object._


### organization

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Name | name | text | yes | system |  |
| 4 | Organization type | org_type | picklist |  | system | value set: org_type (branch, customer, internal, partner, vendor); default: internal |
| 5 | Person organization | is_person | boolean |  | system |  |
| 6 | Parent organization | parent_organization_id | lookup |  | system | lookup -> organization |
| 7 | Slug | slug | text |  | system |  |
| 8 | Active | is_active | boolean |  | system | default: true |
| 9 | Logo | logo_url | url |  | system |  |
| 10 | Notes | notes | long_text |  | system |  |
| 11 | External id | external_id | text |  | system |  |


### product

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Product name | name | text | yes | system |  |
| 4 | Tagline | tagline | text |  | system |  |
| 5 | None | None | picklist | yes | system | value set: product_category (device, file, manufactured, software) |
| 6 | Status | status | picklist | yes | system | value set: product_status (available, beta, coming-soon); default: available |
| 7 | Description | description | long_text |  | custom |  |
| 8 | Features | features | long_text |  | custom |  |


### project

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Project name | name | text | yes | system |  |
| 4 | Status | status | picklist | yes | system | value set: project_status (active, archived, completed, paused); default: active |
| 5 | Priority | priority | picklist | yes | system | value set: project_priority (high, low, normal); default: normal |
| 6 | Owner | owner_name | text |  | system |  |
| 7 | Start date | start_date | date |  | system |  |
| 8 | Target date | target_date | date |  | system |  |
| 9 | Task count | task_count | number |  | system | default: 0 |
| 10 | Description | description | long_text |  | custom |  |


### task

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Created by | created_by | lookup |  | system | lookup -> user |
| 2 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 3 | Title | title | text | yes | system |  |
| 4 | Status | status | picklist | yes | system | value set: task_status (blocked, done, in_progress, planned, waiting); default: planned |
| 5 | Priority | priority | picklist | yes | system | value set: task_priority (high, low, normal, urgent); default: normal |
| 6 | Project | project_name | text |  | system |  |
| 7 | Assignee | assignee_name | text |  | system |  |
| 8 | Due date | due_date | date |  | system |  |
| 9 | Description | description | long_text |  | custom |  |


### user

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Email | email | email | yes | system |  |
| 2 | Display name | name | text | yes | system |  |
| 3 | Role | role | picklist | yes | system | value set: user_role (admin, member); default: member |
| 4 | Type | type | picklist | yes | system | default: human |
| 5 | Status | status | picklist | yes | system | value set: user_status (active, inactive); default: active |
| 6 | Department | department_id | lookup |  | system | lookup -> department |
| 7 | Created by | created_by | lookup |  | system | lookup -> user |
| 8 | Last modified by | last_modified_by | lookup |  | system | lookup -> user |
| 9 | Bio | bio | long_text |  | custom |  |
| 10 | Job title | job_title | text |  | custom |  |


## AGi Org foundation → Mission Control mapping

**Source excerpt:** `docs/_notes/_exerpt_(state_org_foundation).md` (AGi ERD v13 + SQLite cents rules).  
**Visual review:** `RECORD_TYPE_FIELD_INVENTORY.erd.md` (mermaid). Org-party migrate is `scripts/migrate_agi_org.mjs`.

**MC honors:** one Primary Org (`org_type=internal`); collaboration parties are vendor | customer | partner | branch. Production owns Product/Service; Executive owns Policy/Projects/Tasks; Treasury owns transactions (including quote / estimate / invoice kinds); Environment Locations hold structured addresses.

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

### Proposed record types (not in code until ERD sign-off)

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

Do **not** author further `migrate_agi_org` writers (products, treasury, secret copy, host-org disable) until tasked. Org-party dry-run/apply lives in `scripts/migrate_agi_org.mjs` (0.7.145). See `docs/production/state/state_migrate_agi_org.md`.

A user-run script will read AGi Org SQLite and write MC organizations + records using `external_id` for idempotency. Sample rows use prefix `ba_sample:` and are **not** the migrator.

Operator steps after a successful migrate:

1. Confirm Primary Org is the single `internal` row; AGi extra “internal” orgs become `branch` or merge.
2. Disable the built-in AGi Org module so Mission Control is the system of record.
3. Do not run Insert Sample Data on a migrated host unless you want extra `ba_sample:` rows.
