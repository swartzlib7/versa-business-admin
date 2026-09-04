# Mission Control — record-type field inventory (vanilla defaults review)

**Date:** 2026-09-03  
**Source:** generated from the code as it stands (beta working tree): `src/lib/fixtures/record-types.ts` + `src/lib/fixtures/catalog.ts`. Generator: `workspace/AGi-Tools/build_record_type_inventory.py`.

**Purpose:** your review checklist. For each record type: its zone, structure, and the exact default field set the code gives it today. Decide per type what the vanilla set should be; anything you change here becomes the refinement work list.

**Note:** these field definitions are the session-layer catalog (see REMAINING_WORK.md validation) — this inventory reflects what the product actually serves today, not aspirations.

Faculty / collaboration **containers** (`executive`, `dissemination`, `production`, and the rest with `show_as_tab: false` and no fields) are **not** record tabs in the UI. They stay in code as Records Editor parents. They are listed in an appendix, not in the summary table.

## Summary — 22 record types

| Zone | Record type | Label | Structure | Fields defined |
|------|-------------|-------|-----------|----------------|
| communications | communication_message | Messages | list | 4 |
| communications | communication_report | Reports | list | 4 |
| communications | communication_staff | Staff | list | 4 |
| dissemination | dissemination_promotion_marketing | Promotion & Marketing | list | 4 |
| dissemination | dissemination_sales | Sales | list | 4 |
| events | event | Events | list | 4 |
| executive | executive_policy | Policy | header_lines | 7 |
| executive | executive_project | Projects | header_lines | 6 |
| executive | executive_task | Tasks | header_lines | 6 |
| executive | organization | Organization | list | 4 |
| knowledge | knowledge | Knowledge | list | 4 |
| locations | location | Locations | list | 5 |
| production | production_product | Product | header_lines | 6 |
| production | production_service | Service | header_lines | 5 |
| public | contact | Contacts | list | 6 |
| qualification | qualification_certifications_awards | Certifications & Awards | list | 3 |
| qualification | qualification_examination | Examinations | list | 3 |
| qualification | qualification_review | Reviews | list | 3 |
| schedules | schedule | Schedules | list | 4 |
| stats | environment_stat | Stats | list | 7 |
| treasury | treasury_records_assets_materiel | Records, Assets and Materiel | list | 4 |
| treasury | treasury_transaction | Transactions | list | 5 |

**Record types with no fields at all:** none

## Per-zone detail

### Zone: communications

#### communication_message — Messages (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Message subject | name | text | yes | system |  |
| 2 | Message type | message_type | picklist |  | system | value set: message_type (call, email, letter, meeting, social) |
| 3 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 4 | Notes | notes | long_text |  | system |  |


#### communication_report — Reports (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Report title | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Summary | summary | long_text |  | system |  |
| 4 | Notes | notes | long_text |  | system |  |


#### communication_staff — Staff (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Staff member | name | text | yes | system |  |
| 2 | Role | role | text |  | system |  |
| 3 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 4 | Notes | notes | long_text |  | system |  |


### Zone: dissemination

#### dissemination_promotion_marketing — Promotion & Marketing (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Campaign name | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Description | description | long_text |  | system |  |
| 4 | Notes | notes | long_text |  | system |  |


#### dissemination_sales — Sales (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Sales item | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Description | description | long_text |  | system |  |
| 4 | Notes | notes | long_text |  | system |  |


### Zone: events

#### event — Events (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Title | name | text | yes | system |  |
| 2 | Kind | kind | picklist |  | system | value set: event_kind (launch, maintenance, meeting, other) |
| 3 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 4 | Description | description | long_text |  | system |  |


### Zone: executive

#### executive_policy — Policy (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Policy title | name | text | header | yes | system |  |
| 2 | Scope | scope | picklist | header |  | system | value set: policy_scope (compliance, department, organization, product) |
| 3 | Owner | owner | text | header |  | system |  |
| 4 | Summary | summary | long_text | header |  | system |  |
| 5 | Line title | line_title | text | line |  | system |  |
| 6 | Status | status | text | header |  | system |  |
| 7 | Line notes | line_notes | long_text | line |  | system |  |


#### executive_project — Projects (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Project name | name | text | header | yes | system |  |
| 2 | Status | status | picklist | header |  | system | value set: zone_project_status (active, blocked, done, planned) |
| 3 | Owner | owner | text | header |  | system |  |
| 4 | Description | description | long_text | header |  | system |  |
| 5 | Milestone title | milestone_title | text | line |  | system |  |
| 6 | Milestone date | milestone_date | date | line |  | system |  |


#### executive_task — Tasks (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Task title | name | text | header | yes | system |  |
| 2 | Status | status | picklist | header |  | system | value set: zone_task_status (done, in_progress, todo, waiting) |
| 3 | Assignee | assignee | text | header |  | system |  |
| 4 | Notes | notes | long_text | header |  | system |  |
| 5 | Subtask title | subtask_title | text | line |  | system |  |
| 6 | Subtask done | subtask_done | boolean | line |  | system |  |


#### organization — Organization (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Name | name | text | yes | system |  |
| 2 | Organization type | org_type | text |  | system |  |
| 3 | Person organization | is_person | boolean |  | system |  |
| 4 | Parent organization | parent_organization_id | lookup |  | system | lookup -> organization |


### Zone: knowledge

#### knowledge — Knowledge (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Title | name | text | yes | system |  |
| 2 | Asset type | kind | picklist |  | system | value set: knowledge_kind (document, photo, policy, recording, research) |
| 3 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 4 | Summary | summary | long_text |  | system |  |


### Zone: locations

#### location — Locations (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Label | name | text | yes | system |  |
| 2 | Address | address | long_text |  | system |  |
| 3 | Country | country | text |  | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Notes | notes | long_text |  | system |  |


### Zone: production

#### production_product — Product (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Name | name | text | header | yes | system |  |
| 2 | Category | category | picklist | header |  | system | value set: product_category (device, file, manufactured, software) |
| 3 | Description | description | long_text | header |  | system |  |
| 4 | Status | status | text | header |  | system |  |
| 5 | Variant name | variant_name | text | line |  | system |  |
| 6 | Variant price | variant_price | currency | line |  | system |  |


#### production_service — Service (header_lines)

| # | Field | api_name | Type | Role | Required | System | Value set / lookup |
|---|-------|----------|------|------|----------|--------|--------------------|
| 1 | Name | name | text | header | yes | system |  |
| 2 | Status | status | picklist | header |  | system | value set: service_status (active, connected, standby) |
| 3 | Description | description | long_text | header |  | system |  |
| 4 | Rate item | rate_item | text | line |  | system |  |
| 5 | Rate amount | rate_amount | currency | line |  | system |  |


### Zone: public

#### contact — Contacts (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Contact name | name | text | yes | system |  |
| 2 | Contact kind | contact_kind | picklist |  | system | value set: contact_kind (public, staff) |
| 3 | Email | email | email |  | system |  |
| 4 | Phone | phone | phone |  | system |  |
| 5 | Organization | organization | text |  | system |  |
| 6 | Notes | notes | long_text |  | system |  |


### Zone: qualification

#### qualification_certifications_awards — Certifications & Awards (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Certification or award | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Notes | notes | long_text |  | system |  |


#### qualification_examination — Examinations (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Examination | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Notes | notes | long_text |  | system |  |


#### qualification_review — Reviews (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Review | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Notes | notes | long_text |  | system |  |


### Zone: schedules

#### schedule — Schedules (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Label | name | text | yes | system |  |
| 2 | Kind | kind | picklist |  | system | value set: schedule_kind (one-time, recurring) |
| 3 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 4 | Notes | notes | long_text |  | system |  |


### Zone: stats

#### environment_stat — Stats (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Name | name | text | yes | system |  |
| 2 | Value | value | number |  | system |  |
| 3 | Unit | unit | text |  | system |  |
| 4 | Category | category | text |  | system |  |
| 5 | Scale | scale | picklist |  | system | value set: stat_scale (custom, day, hour, month, week, year); default: month |
| 6 | Series | series | long_text |  | system |  |
| 7 | Status | status | picklist |  | system | value set: record_status (active, archived) |


### Zone: treasury

#### treasury_records_assets_materiel — Records, Assets and Materiel (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Item | name | text | yes | system |  |
| 2 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 3 | Description | description | long_text |  | system |  |
| 4 | Notes | notes | long_text |  | system |  |


#### treasury_transaction — Transactions (list)

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Transaction | name | text | yes | system |  |
| 2 | Classification | classification | picklist |  | system | value set: treasury_transaction_classification (disbursement, income) |
| 3 | Amount | amount | currency |  | system |  |
| 4 | Status | status | picklist |  | system | value set: record_status (active, archived) |
| 5 | Notes | notes | long_text |  | system |  |


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
| 1 | Name | name | text | yes | system |  |
| 2 | Organization type | org_type | text |  | system |  |
| 3 | Person organization | is_person | boolean |  | system |  |
| 4 | Parent organization | parent_organization_id | lookup |  | system | lookup -> organization |


### product

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Product name | name | text | yes | system |  |
| 2 | Tagline | tagline | text |  | system |  |
| 3 | None | None | picklist | yes | system | value set: product_category (device, file, manufactured, software) |
| 4 | Status | status | picklist | yes | system | value set: product_status (available, beta, coming-soon); default: available |
| 5 | Description | description | long_text |  | custom |  |
| 6 | Features | features | long_text |  | custom |  |


### project

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Project name | name | text | yes | system |  |
| 2 | Status | status | picklist | yes | system | value set: project_status (active, archived, completed, paused); default: active |
| 3 | Priority | priority | picklist | yes | system | value set: project_priority (high, low, normal); default: normal |
| 4 | Owner | owner_name | text |  | system |  |
| 5 | Start date | start_date | date |  | system |  |
| 6 | Target date | target_date | date |  | system |  |
| 7 | Task count | task_count | number |  | system | default: 0 |
| 8 | Description | description | long_text |  | custom |  |


### task

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Title | title | text | yes | system |  |
| 2 | Status | status | picklist | yes | system | value set: task_status (blocked, done, in_progress, planned, waiting); default: planned |
| 3 | Priority | priority | picklist | yes | system | value set: task_priority (high, low, normal, urgent); default: normal |
| 4 | Project | project_name | text |  | system |  |
| 5 | Assignee | assignee_name | text |  | system |  |
| 6 | Due date | due_date | date |  | system |  |
| 7 | Description | description | long_text |  | custom |  |


### user

| # | Field | api_name | Type | Required | System | Value set / lookup |
|---|-------|----------|------|----------|--------|--------------------|
| 1 | Email | email | email | yes | system |  |
| 2 | Display name | name | text | yes | system |  |
| 3 | Role | role | picklist | yes | system | value set: user_role (admin, member); default: member |
| 4 | Type | type | picklist | yes | system | default: human |
| 5 | Status | status | picklist | yes | system | value set: user_status (active, inactive); default: active |
| 6 | Department | department_id | lookup |  | system | lookup -> department |
| 7 | Bio | bio | long_text |  | custom |  |
| 8 | Job title | job_title | text |  | custom |  |

