# What Versa - Business Admin can do

This page lists everything Versa - Business Admin (VBA) can already do, in one place, with the route or screen for each and a link to the recipe or design document. **Current as of 1.0.28.** It is updated with every release.

**Rule:** before you build, propose or script anything new, search this page, then `GET /api/catalog/record-types`, then the state document for the area. Most things a business needs already exist as a record type, a field behaviour or a record action.

## Before you build

- Search this page for the noun and the verb (shipment, number, print, total, filter, attach).
- Read the type's fields: `GET /api/catalog/record-types/{api_name}` returns the type and its fields (data types, lookups, formulas, summaries, filters).
- Check the live route list: `GET /api` (also Settings → API). A route not listed there does not exist on that install.
- Read the state document for the area ([docs_manifest.md](../production/state/docs_manifest.md) lists them). Decisions there are senior to any brief.
- Prefer configuration over code: Records Editor (Type, Field, Picklist, Layout) can add types, fields, value sets, layouts, formulas, summaries, lookup filters and automatic numbers.
- A capability missing from this page and from the state documents: ask the Primary User. Designing a change: [extending.md](extending.md).

## Where things live

Sidebar: Dashboard, Organization, Collaboration, Environment, Custom Records, Records Editor, Page Builder, Glossary, Users, Settings.

**Organization** (the internal divisions; parent kind `faculty`):

| Division (tab) | Record types it holds |
|---|---|
| Executive | Policies `executive_policy`, Projects `executive_project`, Hats `executive_hat` |
| Distribution | Contacts `contact` (parent api_name `public`) |
| Communications | Messages `communication_message`, Inspections & Reports `inspection_report`, Staff `communication_staff` |
| Dissemination | Sales `dissemination_sales`, Promotion & Marketing `dissemination_promotion_marketing` |
| Treasury | Transactions `treasury_transaction`, Records, Assets and Materiel `treasury_records_assets_materiel` |
| Production | Products `production_product`, Services `production_service`, Shipments `production_shipment` (1.0.26) |
| Qualification | Examinations `qualification_examination`, Reviews `qualification_review`, Certifications & Awards `qualification_certifications_awards` |
| Configuration | The Primary Org (your own organization) and each division's appointed head and deputy (`GET /api/element-config/{element}`) |

**Collaboration** (parties; parent kind `collaboration`): Vendor, Customer, Partner and Branch tabs list `organization` rows by `org_type` (`vendor`, `customer`, `partner`, `branch`; your own is `internal`). Under Vendor: Credentials `vendor_credential`, Integrations `vendor_integration`, Exchange `vendor_exchange`.

**Environment** (parent kind `environment`): Locations `location`, Events `event`, Knowledge `knowledge`, Schedules `schedule`.

**Custom Records** (parent `environment` / `custom`): Statistics `statistics`, Pages `page`, Vehicle Mileage Logs `treasury_vehicle_mileage_log` (1.0.16), Print Templates `print_template` (1.0.27), and a tab for every other type filed under Custom, including your own `c_` types.

**Records Editor**: tabs Type, Field, Picklist, Layout. Where record types, fields, value sets and form layouts are made and changed ([state_records_editor_ux.md](../production/state/state_records_editor_ux.md)).

**Page Builder**: tabs Branding, Canvas (Configuration, Elements `driver_pairing`, Rendering Drivers `render_driver`), Menu, Sky Animation. Builds the public site ([state_page_builder.md](../production/state/state_page_builder.md)).

**Glossary**: sections and entries, the Org Board (divisions, hats and holders), and the UI component gallery.

**Users**: tabs Human, Agent, System. **Settings**: Modes, Appearance, E-Mail Delivery, API. **Dashboard**: a 3D overview of the organization.

**Spatial Twin**: the preview pane beside a listing. It shows a statistic's graph, a hat's write-up, a project's Gantt, and Page Builder previews ([WORKING_WITH_VBA.md](../ops/WORKING_WITH_VBA.md) §2).

## Record types

All are records of a record type, stored as JSON in Postgres. "Header and lines" types hold lines (`zone_role: "list"` fields). Read any type's fields before writing to it.

| Label | api_name | Where | Structure | Notes |
|---|---|---|---|---|
| Policies | `executive_policy` | Executive | header and lines | Lines: title, body, Render as HTML. New records default to Draft |
| Projects | `executive_project` | Executive | header and lines | Lines are tasks (up to five levels, `task_parent_id`). Customer `customer_org_id`. Gantt |
| Hats | `executive_hat` | Executive | list | Purposes, Know-How, Duties (text lists), Holders (multi-lookup to Staff), Images (1.0.10) |
| Contacts | `contact` | Distribution | list | Staff-type contacts belong to an organization; public-type do not. Email sign-ups land here |
| Messages | `communication_message` | Communications | list | Typed by message type |
| Inspections & Reports | `inspection_report` | Communications | list | Shown on the public site as Support Requests |
| Staff | `communication_staff` | Communications | list | Task assignees and hat holders point here |
| Sales | `dissemination_sales` | Dissemination | list | |
| Promotion & Marketing | `dissemination_promotion_marketing` | Dissemination | list | Content field; up to 10 images |
| Transactions | `treasury_transaction` | Treasury | header and lines | Document kind: transaction, quote, estimate, invoice, bill. Lines are a bill of materials |
| Records, Assets and Materiel | `treasury_records_assets_materiel` | Treasury | list | Assets: category, VIN / serial, purchase, odometer, service due, documents (1.0.14) |
| Products | `production_product` | Production | header and lines | Lines are variants (name, price) |
| Services | `production_service` | Production | header and lines | Lines are rate items |
| Shipments | `production_shipment` | Production | header and lines | 1.0.26. Numbered SH-0001; lines are products shipped. [shipments.md](shipments.md) |
| Examinations | `qualification_examination` | Qualification | list | |
| Reviews | `qualification_review` | Qualification | list | Raised when an examination does not pass |
| Certifications & Awards | `qualification_certifications_awards` | Qualification | list | |
| Credentials | `vendor_credential` | Collaboration → Vendor | header and lines | Secret Configuration (encrypted); lines are the Users list (1.0.20) |
| Integrations | `vendor_integration` | Collaboration → Vendor | header and lines | Direction, mode; one flow line per record type (1.0.20) |
| Exchange | `vendor_exchange` | Collaboration → Vendor | list | One row per item sent or received (1.0.20) |
| Locations | `location` | Environment | list | Address, phone, email, Organization, Primary address |
| Events | `event` | Environment | list | |
| Knowledge | `knowledge` | Environment | list | Documents, recordings, photos, research |
| Schedules | `schedule` | Environment | list | Location lookup; shown as a calendar on the public site |
| Statistics | `statistics` | Custom Records | header and lines | Values are stored as graph lines keyed by statistic, series and slot. [statistics.md](statistics.md) |
| Pages | `page` | Custom Records | list | Visitor pages; body as text or HTML |
| Vehicle Mileage Logs | `treasury_vehicle_mileage_log` | Custom Records | header and lines | One log per vehicle and tax year; lines are trips (1.0.14) |
| Print Templates | `print_template` | Custom Records | list | 1.0.27. How a record type prints: Prints, Use when, paper, layout (JSON). Invoice, Estimate, Quote and Packing Slip ship ready. [printing.md](printing.md) |
| Configuration (Elements) | `driver_pairing` | Page Builder → Canvas → Elements | list | One record × one driver, placed on a Cell |
| Rendering Drivers | `render_driver` | Page Builder → Canvas | list | Catalog of the code renderers |
| Elements (legacy) | `page_element` | — | list | Legacy palette; not a staff tab |
| Custom | `custom` | Environment | list | Parent for the Custom listings |
| Organization | `organization` | Collaboration tabs, Primary Org | list | A typed table, not a `record` row. `GET /api/organizations` |
| Zone types | `executive`, `public`, `communications`, `dissemination`, `treasury`, `production`, `qualification`, `vendor`, `customer`, `partner`, `branch` | — | list | Parents that lookups and fields can address; no tab of their own |

Admins add their own record types and fields in Records Editor (or `POST /api/catalog/record-types`, `POST /api/catalog/fields`). Custom api_names must start with `c_` ([state_upgradability.md](../production/state/state_upgradability.md)). A new type can be a list or header and lines.

## Field behaviours

Set in Records Editor → Field, or through `POST /api/catalog/fields` and `PATCH /api/catalog/fields/{object_api_name}/{api_name}`. The property names below are what `GET /api/catalog/record-types/{api_name}` returns.

- **Data types** (`data_type`): `text`, `long_text`, `number`, `currency`, `boolean`, `date`, `datetime`, `email`, `url`, `phone`, `picklist`, `multipicklist`, `lookup`, `file`, `image_gallery` (before 1.0.10); `text_list` and `multi_lookup` (1.0.10); `attachments` and `summary` (1.0.14); `formula` (1.0.15). Values are stored as text; a list or object sent as a value is stored as its JSON text (1.0.22).
- **Placement** (`zone_role`: `header` or `list`): on a header-and-lines type, Header fields are on the header form, Lines fields are columns of the lines table.
- **Formula** (1.0.15): Data type Formula, `formula: "line_quantity * line_unit_cost"`. Uses fields of the same header or line, `+ - * /`, comparisons, `SUM`, `ROUND`, `MIN`, `MAX`, `IF`, `FIRST`. Read-only; worked out on every save. Loops are refused when the field is saved.
- **Calculated default** (1.0.15): Number or Currency field → Calculated default, `default_formula`. Follows the formula until someone types a different value; clearing it follows again. Used by Unit price, Line total, Amount and Actual cost on Transactions.
- **Summary** (1.0.14): Data type Summary on a header, `summary: { aggregate, source_field, filter_field, filter_value, percent_of }`. Sum, count, smallest, largest or average of a lines field, optionally only for matching lines, or as a percentage of another summary. Read-only.
- **Lookup** (any record type since 1.0.14): `lookup_object_api_name`. Delete rule `lookup_delete_rule`: `orphan` (default) or `cascade`.
- **Lookup filter** (1.0.15; second form 1.0.25): Only offer records where … equals …, `lookup_filter: { field, value }` (Vendor shows `org_type = vendor`); or … or equals this record's field, `lookup_filter: { field, from_field }` (Ship to shows the Customer's Locations; on a line, read from the same line). Saves are checked: a record the filter does not offer is refused with `400 LOOKUP_NOT_OFFERED` (1.0.25).
- **Multi-lookup** (1.0.10): Data type Multi-lookup; links one record to several (Hat Holders).
- **Text list** (1.0.10): numbered entries, added, edited, removed and dragged into order (Hat Purposes, Know-How, Duties).
- **Picklists and value sets**: Records Editor → Picklist, or `/api/catalog/value-sets`. Picklist fields name a value set (`value_set_api_name`). Status fields are picklists (1.0.6); the field's `default_value` is the default.
- **Image gallery**: up to 10 images, each with a description (1.0.10). Upload with `POST /api/records/images` (PNG, JPEG, WebP, GIF, 2 MB).
- **Attachments / Documents & Photos** (1.0.14; on every business record and organization 1.0.23): Data type Attachments. Up to 10 files of 20 MB, types from the `file_mime` value set. See [attachments.md](attachments.md).
- **Secret fields** (1.0.18): `is_secret`. Encrypted in the database, never sent by the API (reads back as `••••••`). Set in the catalog seed only; Records Editor and the fields API cannot set it. Credential Configuration is always secret.
- **Read-only fields** (1.0.15): `read_only`. Worked out by VBA (Allocated, Remaining, Shipped before). Seed only.
- **Number automatically** (1.0.26): header Text field → Number automatically, Prefix, Digits; `auto_number: { prefix, digits }`. VBA gives the next number on the first save, taken from a locked counter inside the insert, so parallel saves never share one and deleted numbers are never reused. Typing or changing it is refused with `400 NUMBER_IS_AUTOMATIC`; an update that leaves it out keeps it. Clone takes a new number.
- **Show as column**: on a Lines field, Show as column in lines table (`show_in_column`). On a header field of a header-and-lines type, Show as column in the records list (1.0.26): the records list then shows only those fields.
- **Allocation** (1.0.15): `allocation: { amount_field, target_total_field, target_allocated_field, target_remaining_field }` on a lines lookup. Each line takes a portion of the target's total (bill matching). Seed only.
- **Required** (`is_required`): Records Editor → Required. Every save checks it (1.0.28): a new record or line must fill it, and an update may not empty one the record had (`400 REQUIRED_FIELD`, naming the field and line). Records saved before still save. A Required field with a default value takes it on a new record. Not asked: Summary, Formula, read-only, Number automatically and Yes/No fields; Configuration asks for the Record or Filter only when its Selection uses it.
- **Hide, not delete** (`active: false`): `DELETE /api/catalog/fields/{object_api_name}/{api_name}` hides a system field and keeps its data. `DELETE /api/catalog/record-types/{api_name}` deactivates a type. Never delete a system field or give an old api_name a new meaning.
- **Layouts**: Records Editor → Layout, or `/api/catalog/layouts` (`detail`, `edit`, `list`). Sections with 1 to 8 columns.

## The save pipeline

Every record write goes through one server pipeline: create, update, add lines, clone, convert, create shipment, from the screen, the API, agents and integrations alike (`src/lib/records/pipeline.ts`). Design: [state_records_pipeline.md](../production/state/state_records_pipeline.md).

1. **Field check** (1.0.24): a field the type does not have answers `400 UNKNOWN_FIELD`, naming it, the nearest real field and the type's fields. A field sent beside `data` instead of inside it answers `400 FIELD_OUTSIDE_DATA`. Hidden fields still save. Skipped for Clone, Convert, integration copies and the sample pack.
2. **Lookup filters** (1.0.25): a changed filtered lookup must hold a record the filter offers, else `400 LOOKUP_NOT_OFFERED`.
3. **Attachments** (1.0.23): only files stored on this install, at most 10.
4. **New records** (1.0.26): an empty Status takes the Status field's default, else `active`. Number automatically fields refuse typed or changed values (`NUMBER_IS_AUTOMATIC`). **Required fields** (1.0.28) are checked after the calculations: `400 REQUIRED_FIELD`.
5. **Type steps**: Shipments get Shipped before on each line; Statistics get their derived fields, their Time zone, and a ready feed when Source Date and Value are empty; Print Templates must print a real type with a layout that names real fields (`400 PRINT_TEMPLATE_INVALID`, 1.0.27).
6. **Integrated-record rule** (1.0.15): a record with an External ID (from an outside system such as Wave, or a copy received through an Integration) keeps what was written; calculations are skipped.
7. **Calculations**: line formulas and calculated defaults, then header Summary fields, then header formulas.
8. **Allocation**: a save that takes a bill past its total is refused (`OVER_ALLOCATED`); a bill's Amount cannot drop below what is allocated (`BELOW_ALLOCATED`). One cent of rounding is allowed.
9. **After the save**: bills the record points at are re-totalled; statistics fed by the type are recomputed; the record is queued for every Integration that sends its type (1.0.20). Deletes do the same.

Never send calculated fields (Summary, Formula, Allocated, Remaining, Shipped before, Backordered). Send a calculated default only to override it.

## Record actions

| Action | What it does | Route | Recipe |
|---|---|---|---|
| **Clone** (1.0.15) | Copies any record and its lines as "Copy of …": new ids, External ID cleared, bill links cleared, automatic number re-given | `POST /api/records/{id}/clone` | [records-and-lines.md](records-and-lines.md) |
| **Convert to invoice** (1.0.15) | Turns a quote or estimate into a draft invoice (`converted_from_id`) and marks the source Converted. Refused for integrated records | `POST /api/records/{id}/convert` | [job-costing.md](job-costing.md) |
| **Create shipment** (1.0.26) | From an invoice: a Draft shipment of what it still owes, line by line. `400 NOT_AN_INVOICE`, `409 NOTHING_TO_SHIP`. Integrated invoices can ship | `POST /api/records/{id}/shipment` | [shipments.md](shipments.md) |
| **Linked from** (1.0.15) | Every record whose lookup points at this one, grouped by type and field, with amounts and a total per group | `GET /api/records/{id}/linked` | [records-and-lines.md](records-and-lines.md) |
| **Relations** | Explicit inbound and outbound relations with display names; `POST /api/records` can create them | `GET /api/records/{id}/relations` | — |
| **Print** (1.0.27) | The record as a PDF with a print template (the one whose Use when fits, or one chosen); or kept in its Documents & Photos | `GET /api/records/{id}/print`, `POST /api/records/{id}/print`, `GET /api/records/{id}/print-templates` | [printing.md](printing.md) |
| **Add lines** (1.0.14) | Appends lines without resending the list; totals and fed statistics update | `POST /api/records/{id}/lines` | [records-and-lines.md](records-and-lines.md) |

On screen, Print, Clone, Convert to invoice and Create shipment are buttons on the open record. Linked from sits under every open record.

## Domain capabilities

### Job costing

- Estimate with a bill of materials on Transactions (1.0.15): per line Vendor, Unit cost, Markup %; Unit price, Line total and Line cost follow. Header Subtotal, Cost total, Margin, Margin %, Amount.
- Projects link to a Customer; Transactions link to a Project.
- Vendor bills: Document kind Bill. Invoice lines pick the Vendor bill that covered them; Actual cost and Variance per line; the bill shows Allocated and Remaining.
- Review a project's estimates, invoices and bills with `GET /api/records/{id}/linked`.
- Recipe: [job-costing.md](job-costing.md). Design: [state_records_pipeline.md](../production/state/state_records_pipeline.md). Staff: [User Manual §9](../ops/BUSINESS_ADMIN_USER_MANUAL.md).

### Shipments (1.0.26)

- Production → Shipments: customer, Ship to (the customer's Locations only), Ship from, invoice, project, carrier, tracking, boxes, delivered, Documents & Photos.
- Lines: product, SKU / variant, Ordered, Shipped before, Shipped, Backordered, Box. Units shipped totals the Shipped column.
- Create from an invoice; ship in parts; the next Create shipment offers only what is left.
- Status Draft → Packed → Shipped → Delivered. Numbered SH-0001 automatically.
- Recipe: [shipments.md](shipments.md). Design: [state_shipments.md](../production/state/state_shipments.md).

### Statistics

- Manual capture on screen (Table view with Add row and trash; Enhanced UI with one box per step) and over the API: `POST /api/statistics/{id}/lines`, `PATCH /api/statistics/{id}/lines`, `DELETE /api/statistics/{id}/lines`, `GET /api/statistics/{id}/lines`.
- Scripts post values with an access token (`Authorization: Bearer vba_…`, 1.0.20).
- Fed from records (1.0.14): Source record type, Read from Lines or Records (1.0.15), Date field, Value field (empty = count), Only lines where … equals …. Date and filter can be the record's own fields when reading lines (1.0.25). Commas in the filter value match any of them (1.0.26). `POST /api/statistics/{id}/refresh` recomputes.
- Ready feeds (1.0.26): a type can carry a `statistic_feed`; Shipments feed Units Shipped when Date and Value are left empty.
- Period target with Quota, Met, Short and Needed, and a catch-up pace line (1.0.12). Single Series or Dynamic Series.
- Time zone per statistic and per install; days, weeks and months step by the calendar (1.0.21).
- Graphs in the Spatial Twin, the lightbox, and Page Builder Statistics Cells (grids of 1, 2, 4, 8 or 12).
- Recipe: [statistics.md](statistics.md). Design: [state_statistics_environment.md](../production/state/state_statistics_environment.md). Staff: [User Manual §4](../ops/BUSINESS_ADMIN_USER_MANUAL.md).

### Files

- Documents & Photos on every business record type and every organization (1.0.23).
- Attach in one call: `POST /api/records/{id}/files`, `POST /api/organizations/{id}/files`. Take one off: `DELETE /api/records/{id}/files/{fileId}`, `DELETE /api/organizations/{id}/files/{fileId}`.
- Upload without attaching: `POST /api/records/files`. Read: `GET /api/records/files/{id}`. Allowed types and size: `GET /api/records/files`.
- Uploads can live in any folder (`VBA_UPLOADS_DIR`), for example a synced drive (1.0.14).
- Recipe: [attachments.md](attachments.md).

### Integrations, access tokens, credentials and secrets (1.0.20)

- Integrations between two VBA installs: send or receive, push or pull, one flow line per record type with a filter (`eq`, `ne`, `contains`, `starts_with`, `empty`, `not_empty`, `in`, `gte`, `lt`).
- Statistics travel with their values and time zone; a value that would land on another day is refused.
- Endpoints: `POST /api/exchange` (receive a push), `GET /api/exchange` (answer a pull), `POST /api/exchange/actions` (`run`, `resend`, `repull`).
- Exchange lists every item that went out or came in, with ok, skipped, pending or error.
- Access tokens: `POST /api/credentials/{id}/token` on a Credential with Auth type Access token. Shown once; each acts as its own System account and works only where its Integration allows.
- Use a stored secret from a script: be on the Credential's Users list, sign in as yourself, `GET /api/credentials/{id}/secret`. Others get `403 NOT_ON_USERS_LIST`.
- Secret fields are encrypted at rest and masked in every API answer (1.0.18).
- Recipe: [integrations.md](integrations.md). Design: [state_integrations.md](../production/state/state_integrations.md). Ops Manual §2.11–2.12.

### Hats and Projects

- Hats (1.0.10): write-up of a post with Purposes, Know-How, Duties, Holders and up to 10 captioned images; shown in the Spatial Twin.
- Projects: task lines up to five levels deep, drag to reorder or nest, percent complete, status, assignee, due date (1.0.9). Gantt in the Spatial Twin.
- Work APIs: `GET /api/projects` (with `lines=overdue` for overdue tasks across projects), `GET /api/projects/{id}`, `GET /api/tasks` (filters `status`, `projectId`, `assignee`, `q`, `overdue=true`), `POST /api/tasks`, `PATCH /api/tasks/{id}` (an assignee may change status and percent).
- Print a hat or a project Gantt: the Twin's **Print** button opens the browser pages `/print/hat/<id>` and `/print/project/<id>` and the print dialog (1.0.10). These are screens, not API routes.
- Design: [state_hats.md](../production/state/state_hats.md).

### Organizations and Locations

- Organizations: `GET /api/organizations?org_type=…`, `POST /api/organizations`, `PATCH /api/organizations/{id}`; organization lines at `/api/organizations/{id}/lines`.
- The Primary Org is your own organization (Organization → Configuration).
- Locations belong to an organization (`organization_id`). Only one Location per organization has Primary address on (1.0.7); the Primary Org's primary Location feeds the public footer address, phone and email (1.0.6).
- Create shipment uses the customer's and your own Primary address Locations.

### Users and agents

- Agents are users of type `agent` (`human` | `agent`). List them with `GET /api/users?type=agent`. No separate agent area.
- Writes need `role` admin; a member may update only their own user.
- Users → System lists the accounts behind access tokens; they never sign in.
- Sign in from a script with the proof-of-work login: [sign-in.md](sign-in.md). Sessions are signed and expire (1.0.17). HTTP Basic was removed (1.0.20).
- Account mail (1.0.5): password reset, email confirmation and welcome mail once Settings → E-Mail Delivery has an active mailbox Credential (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/confirm-email`). An agent admin can set a password without a mailbox. Design: [state_account_mail.md](../production/state/state_account_mail.md).

### Page Builder and the public site

- Canvases (up to 12, 1.0.19) made of Rows and Cells; each Cell paints an Element (a record × a driver). Full-HTML-page canvases, SEO fields, `/sitemap.xml`, `/robots.txt` (1.0.4).
- Rendering drivers include Page header, Statistics, Inspections & Reports, Integration, Schedule, Project (table, cards, Gantt), Transaction (Job and money), Asset card, Organization board, Location (card or map), Contact (with email sign-up) and Embed (1.0.2 to 1.0.16).
- Element filters (Filter mode, 1.0.16; `in`, `gte`, `lt` added 1.0.20). Row headings, site menu switch per canvas (1.0.16).
- Public pages at `/p/<slug>`; public org board at `/board`. Public data: `GET /api/public/business`, `/api/public/products`, `/api/public/services`, `/api/public/staff`, `/api/public/knowledge-articles`; email sign-up `POST /api/public/subscribe`.
- Site pack: the default site (slides, the Versa page canvases, styles, menus; `ba_site:` ids) installs on first boot and updates unedited pages on upgrade (1.0.19). The site lives in Postgres.
- Branding, logo, footer and sky animation: `/api/settings/branding`.
- Design: [state_page_builder.md](../production/state/state_page_builder.md), [state_public_site.md](../production/state/state_public_site.md). Staff: [User Manual §7](../ops/BUSINESS_ADMIN_USER_MANUAL.md).

### Demo mode and the sample pack

- Settings → Modes → Demo. On installs the sample pack (`ba_sample:` ids): organizations, a project, estimate, invoice and matched vendor bill, a van with documents and a mileage log, statistics, and the Demo canvas tour (1.0.16).
- Off deletes the sample pack and keeps the Primary Org, install accounts and site pack. Status and switch: `GET /api/settings/sample-data`, `POST /api/settings/sample-data`.
- Sample records go through the save pipeline. Leave `ba_sample:` and `ba_site:` records out of anything that copies or sends records.
- Design: [state_demo_content.md](../production/state/state_demo_content.md).

### Settings

- Modes: Demo, Maintenance mode (signed-in users still see the site), Public sign-in link, install Time zone (1.0.21). `GET /api/settings/system`, `PUT /api/settings/system`.
- Appearance: themes Light, Dusk, Slate, Dark, Architect; the default site theme (1.0.7).
- E-Mail Delivery: the system mailbox Credential.
- API: the same list as `GET /api`.

### Records lists

- Every backend listing has filter chips, a column picker and name search ([state_listing_toolbar.md](../production/state/state_listing_toolbar.md)).
- `GET /api/records` filters: `type`, `parent_kind`, `parent`. Product and project shortcuts: `/api/products`, `/api/projects`.

### Operations

- Health and version: `GET /api/health` (also `time_zone`, `process_time_zone`).
- Backup: `npm run backup` (database, settings, optionally uploads; never the data key).
- Restarts, upgrades and what never to do: [operations.md](operations.md) and the [Ops Manual](../ops/BUSINESS_ADMIN_OPS_MANUAL.md).

## Printing (1.0.27)

Any record type can print to PDF, made on the server (no browser needed), so people and agents get the same file. Recipe: [printing.md](printing.md). Design: [state_printing.md](../production/state/state_printing.md).

- **The template maker** (1.0.28): Records Editor → **Print Templates**: a type's templates with Origin (Shipped, Edited, Own); New Template, Edit, Duplicate, Archive or Delete, Reset to shipped. The maker has a blocks palette (drag or click), the page with header bands, body and footer bands, settings for the selection (a band's Shows on), How it prints, and Preview PDF of the unsaved draft for a real record. `GET /api/print-templates?type=`, `POST /api/print-templates/{id}/reset`, `POST /api/print-templates/preview`.
- **Print templates** are records of `print_template` (Records Editor → Print Templates, or Custom Records → Print Templates): Prints (the record type), Order, **Use when** (a field equals a value; commas match any), Paper (Letter, A4, Legal), Orientation, Margins, Font (Helvetica, Times, or Hack, which prints most scripts), and a **Layout** (JSON). Archived templates are not offered.
- **Layout**: header and footer **bands**, each with **Shows on**: every page, first page, every page after the first, last page, or chosen pages (`"1, 3"`); and **body** blocks: text with `{field}`, `{page}`, `{pages}`, `{today}`; fields (label and value grid); organization (your own or a lookup's, with its Location address, phone, email and logo); lines table (chosen columns, totals); signature lines; page number; spacer; divider; columns side by side.
- **Long documents**: the lines table flows onto further pages and repeats its headings; Page n of N.
- **Values print as people read them**: lookups as names, picklists as labels, dates as "Nov 27, 2026", money in the record's Currency.
- **Routes**: `GET /api/records/{id}/print-templates` (the choices, the fitting one first); `GET /api/records/{id}/print` (`?template=`, `&download=1`); `POST /api/records/{id}/print` keeps the PDF in Documents & Photos. Errors: `NO_PRINT_TEMPLATE`, `NO_MATCHING_TEMPLATE`, `WRONG_TEMPLATE`, `PRINT_TEMPLATE_INVALID`.
- **Shipped templates**: Invoice, Estimate, Quote (Transactions, by Document kind) and Packing Slip (Shipments, with a Received by signature on the last page). A release updates a shipped template only while it is unedited; an edited one is kept, and Reset to shipped puts the release's version back. A deleted one comes back on the next start: archive it instead.
- **On screen**: the **Print** menu on an open record: template, Open PDF, Download PDF, Save PDF to Documents & Photos.
- Hats and project Gantts also print through the browser (Hats and Projects, above).

## Not built yet

Do not assume these exist. Do not build them without the Primary User.

- **Stock levels / inventory**: planned after printing, with its own design round. Shipping does not reduce stock ([state_shipments.md](../production/state/state_shipments.md) §6).
- **Shipments and print templates over Integrations**: they do not travel between installs. Integrations do not carry lookups, attachments, users or organizations ([state_integrations.md](../production/state/state_integrations.md) §3.9).
- **Integration extras**: a chain A → B → C, overlapping tokens during rotation, a held request for instant pulls, and adapters for third-party systems ([state_integrations.md](../production/state/state_integrations.md) §3.8, §3.9, §6).
- **Job costing extras**: totals across linked records stored on the project; a line split across several bills; auto-creating vendor bills from the bill of materials; production costing (labour, machine time, electricity); flows and triggers as pipeline steps ([state_records_pipeline.md](../production/state/state_records_pipeline.md), L-1 to L-8).
- **Linked from and Clone on screen for flat list types** such as Records, Assets and Materiel (L-7). The API clone works on any record.
- **Allocated / Remaining shown only on bills**: invoices show them empty today (L-8).
- **Alerts sent by e-mail**: E-Mail Delivery serves account mail only ([state_layout_ui.md](../production/state/state_layout_ui.md)).
- **Receipts** (the customer-side analog of vendor Integrations): named only; no tab until tasked ([shape_business_admin.md](../production/state/shape_business_admin.md)).

## Keeping this page current

Every release that adds or changes a capability updates this page in the same change, as it updates the release notes ([RELEASE_NOTES.md](../ops/RELEASE_NOTES.md)): the record type, field behaviour, route, version and link. Remove a "Not built yet" line when it ships. Cite only routes listed in `src/lib/api/inventory.ts` and api_names in the catalog seed.
