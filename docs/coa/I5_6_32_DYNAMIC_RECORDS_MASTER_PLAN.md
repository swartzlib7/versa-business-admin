# I5.6.32 — Dynamic Records System: End-to-End Master Plan & Architecture

> **Owner:** Versa (COA) · **Product:** Mission Control (project #26)  
> **Source:** Stephen Nortje direction (2026-07-22 through 2026-07-28)  
> **Status:** COMPREHENSIVE PLAN · Ready for Stephen Review  
> **Last updated:** 2026-07-28  
> **Depends on:** I5.6.32a (Nav/Qual Records), I5.6.32b (Catalog Schema API), I5.6.32c (Records Editor UX)

---

## 1. Architectural Vision & Scope

The **Dynamic Records System** provides Mission Control with an extensible data-modeling engine that allows operators and AI agents to declare custom record types, field definitions, structure modes, and picklist value sets without breaking or collapsing first-class typed relational core tables (`projects`, `tasks`, `products`, `users`, `parties`).

### Core Philosophy: Metadata-Driven Dynamic Records vs Typed Core Objects

1. **Typed Core Objects Stay Typed:**
   - `projects`, `tasks`, `products`, `users`, `parties` retain typed database tables, primary foreign keys, and typed routes.
   - They are NOT flattened into generic entity-attribute-value (EAV) rows.
   - Dynamic capabilities are applied *to* them via catalog layout and field definitions.

2. **Custom Record Types Expand Operational Zones:**
   - Any zone element (Organization Faculty, Collaboration Party, Environment Node) can own dynamic record types.
   - Record types render as **named dynamic tabs** or scoped record listings (e.g., *Public Mandates*, *Certifications*, *Treasury Records*, *Audit Logs*).
   - Record types carry a configurable **Structure Mode** (`list`, `header`, or `header_lines`).

---

## 2. Database Schema & ORM Architecture (Drizzle Spec)

The dynamic records data model consists of 6 interconnected tables added to `src/lib/db/schema.ts`:

```
+-------------------+       +-----------------------+       +---------------------+
|    record_types   | 1---* |     record_fields     | *---1 |      value_set      |
+-------------------+       +-----------------------+       +---------------------+
| id (PK)           |       | id (PK)               |       | id (PK)             |
| api_name (UQ)     |       | type_id (FK)          |       | api_name (UQ)       |
| label             |       | api_name              |       | label               |
| parent_kind       |       | label                 |       +----------+----------+
| parent_api_name   |       | data_type             |                  | 1
| structure         |       | value_set_api_name    |                  | *
| show_as_tab       |       | sort_order            |       +----------+----------+
| sort_order        |       +-----------------------+       |   value_set_item    |
+---------+---------+                                       +---------------------+
          | 1                                               | id (PK)             |
          | *                                               | value_set_id (FK)   |
+---------+---------+       +-----------------------+       | api_value           |
|      records      | 1---* |     record_lines      |       | label               |
+-------------------+       +-----------------------+       +---------------------+
| id (PK)           |       | id (PK)               |
| org_id (FK)       |       | record_id (FK)        |
| type_api_name     |       | line_number           |
| parent_kind       |       | data (JSONB)          |
| parent_api_name   |       +-----------------------+
| name / title      |
| status            |
| data (JSONB)      |
+-------------------+
```

### 2.1 Schema Definitions (Drizzle TypeScript Spec)

```typescript
// Record Type Definition
export const recordTypes = pgTable(
  'record_types',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    apiName: text('api_name').notNull().unique(),
    label: text('label').notNull(),
    description: text('description').notNull().default(''),
    parentKind: text('parent_kind').notNull(), // 'faculty' | 'collaboration' | 'environment'
    parentApiName: text('parent_api_name').notNull(), // e.g. 'public', 'vendor', 'branch'
    structure: text('structure').notNull().default('list'), // 'list' | 'header' | 'header_lines'
    showAsTab: boolean('show_as_tab').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    icon: text('icon'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('record_type_parent_kind_check', sql`${table.parentKind} IN ('faculty', 'collaboration', 'environment')`),
    check('record_type_structure_check', sql`${table.structure} IN ('list', 'header', 'header_lines')`),
    uniqueIndex('record_type_parent_api_idx').on(table.parentKind, table.parentApiName, table.apiName),
  ]
);

// Record Fields Definition
export const recordFields = pgTable(
  'record_fields',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    typeApiName: text('type_api_name').notNull().references(() => recordTypes.apiName, { onDelete: 'cascade' }),
    apiName: text('api_name').notNull(),
    label: text('label').notNull(),
    dataType: text('data_type').notNull(), // 'text' | 'long_text' | 'number' | 'boolean' | 'date' | 'picklist' | 'lookup' | 'json'
    isRequired: boolean('is_required').notNull().default(false),
    isSystem: boolean('is_system').notNull().default(false),
    defaultValue: text('default_value'),
    valueSetApiName: text('value_set_api_name'),
    lookupObjectApiName: text('lookup_object_api_name'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('record_field_type_api_idx').on(table.typeApiName, table.apiName),
    check('record_field_data_type_check', sql`${table.dataType} IN ('text', 'long_text', 'number', 'boolean', 'date', 'picklist', 'lookup', 'json')`),
  ]
);

// Records Instance Table
export const records = pgTable(
  'records',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    parentKind: text('parent_kind').notNull(),
    parentApiName: text('parent_api_name').notNull(),
    typeApiName: text('type_api_name').notNull().references(() => recordTypes.apiName),
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('records_status_check', sql`${table.status} IN ('active', 'archived', 'draft')`),
  ]
);

// Record Lines (for header_lines structure mode)
export const recordLines = pgTable(
  'record_lines',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    recordId: text('record_id').notNull().references(() => records.id, { onDelete: 'cascade' }),
    lineNumber: integer('line_number').notNull(),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('record_lines_rec_line_idx').on(table.recordId, table.lineNumber),
  ]
);
```

---

## 3. Structure Modes & Rendering Behavior

Every Record Type defines a `structure` parameter that controls its UI layout and interaction model:

| Mode | UI Layout | Ideal Use Case | Data Model Behavior |
|------|-----------|----------------|---------------------|
| **`list`** | Flat tabular listing with dynamic filtering, column sorting, pagination, and side-drawer/modal row edit. | General operational records (Public mandates, Dissemination logs, Certifications). | Single `records` row. Dynamic fields stored in `records.data` JSONB. |
| **`header`** | Single-record card/form layout emphasized as a key document or configuration state. | Master policy parameters, single-instance operational profiles. | Single `records` row per scope; fields displayed in structured form sections. |
| **`header_lines`** | Document Header form at the top + child Line Items data grid below with inline line addition, deletion, and subtotaling. | Purchase Orders, Audit Checklists, Invoices, Work Breakdowns. | Header stored in `records`; child items stored in `record_lines` ordered by `line_number`. |

---

## 4. Picklists & Value Sets Model

Picklists provide standardized drop-down options across dynamic record fields.

1. **Global Value Sets:**
   - Defined in `value_set` and `value_set_item`.
   - Reusable across multiple record types (e.g. `certification_status`, `priority_level`, `compliance_grade`).
2. **Local Field Picklists:**
   - Created directly inside the Records Editor field builder.
   - Auto-registers an underlying `value_set` keyed as `${type_api_name}_${field_api_name}_vs`.
3. **Editor Binding:**
   - Operators can bind any `picklist` field to an existing `value_set_api_name` or declare new options inline.

---

## 5. Records Editor Surface (`/settings/records`)

The **Records Editor** is accessible via:
1. **Global Admin Path:** Nav -> Settings -> **Records Editor** (`/settings/records`).
2. **Contextual Parent Path:** Zone View -> Parent Element (e.g. Public Zone) -> Configuration -> **"Manage Record Types"**.

### Editor Capabilities:
- **Type Manager:** Add, rename, reorder, or soft-deactivate record types for any parent.
- **Structure Selector:** Set mode to `list`, `header`, or `header_lines`.
- **Display Options:** Toggle `show_as_tab` (creates a dedicated zone sub-tab) vs group under a shared Records tab.
- **Field Builder:** Drag-and-drop / sortable list of field definitions; configure data types, mandatory flags, default values, and picklist options.
- **Live Schema Preview:** Instant interactive preview of generated form and listing columns.

---

## 6. Complete API Surface Contracts

### 6.1 Record Types & Schema Management API
- `GET /api/catalog/record-types` — List all record types (optional filters: `?parent_kind=faculty&parent_api_name=public`).
- `POST /api/catalog/record-types` — Create a new record type definition.
- `GET /api/catalog/record-types/[apiName]` — Fetch single type definition with field definitions and value sets.
- `PATCH /api/catalog/record-types/[apiName]` — Update type metadata (label, structure, show_as_tab, sort_order).
- `POST /api/catalog/record-types/[apiName]/fields` — Add or update field definitions on a type.
- `GET /api/value-sets` — List value sets and option items.
- `POST /api/value-sets` — Create or update value set items.

### 6.2 Record Instance Data API
- `GET /api/records?type=[apiName]&parent_kind=[kind]&parent_api_name=[name]` — Fetch record instances.
- `POST /api/records` — Create a new record instance.
- `GET /api/records/[id]` — Fetch record instance detail (includes child `lines` if `header_lines`).
- `PATCH /api/records/[id]` — Update record instance header and `data` JSONB fields.
- `DELETE /api/records/[id]` — Soft delete / archive record instance.
- `POST /api/records/[id]/lines` — Add or replace line items for `header_lines` records.

---

## 7. Implementation Sequence for Web-Dev

| Slice | Title | Description | Status / Deliverable |
|-------|-------|-------------|----------------------|
| **Slice 1** | Zone Pages Live Integration | Replace mock tables in Executive, Public, Comms, Dissemination, Treasury, Production, Qualification with live dynamic records queries. | **DONE (v0.7.68 / caaec90)** |
| **Slice 2** | Records Editor UI (`/settings/records`) | Build `/settings/records` standalone page with type manager, structure mode picker, and field builder UI. | **NEXT (Task #219)** |
| **Slice 3** | DB Schema Migration & ORM Wire-up | Add `record_types`, `record_fields`, `records`, `record_lines` to `schema.ts`, generate Drizzle migration, and connect API routes. | **Queued after Slice 2** |
| **Slice 4** | Structure Mode Renderers | Build specialized UI renderers for `header` card view and `header_lines` grid component. | **Queued after Slice 3** |

---

## 8. Summary for Stephen Review

This Master Plan establishes a complete, non-breaking, fully scalable architecture for dynamic records in Mission Control. It honors all architectural constraints (typed table preservation for core objects, config-driven zone extension, clean separation of concerns) and provides a clear roadmap for web-dev execution.
