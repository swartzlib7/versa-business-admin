// Drizzle ORM schema — matches DB cutover checklist §3 target schema sketch.
// Phase 1: scaffold only. No agents table — agents ARE users with type='agent'.
// Locked decisions (COA 2026-07-21):
//   1. ORM: Drizzle (+ drizzle-kit + postgres-js)
//   2. Hosting: managed Supabase later; Phase 1 local = plain Postgres via Docker
//   3. Docker on host: OK for plain Postgres only
//   4. Session: keep httpOnly cookie as-is (Phase 1-2). No JWT, no sessions table.
//   5. Agents ARE Users: single users table; type=agent; agent-only fields in data JSONB.
//   6. API version: bump /api index with cutover (document when API contract touched).
//   7. /api/agents*: REMOVE (Phase 4, not Phase 1). Schema must NOT invent an agents table.

import {
  type AnyPgColumn,
  pgTable,
  text,
  jsonb,
  timestamp,
  date,
  integer,
  boolean,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Core entities (baseline ERD locked)
// ---------------------------------------------------------------------------

// Organization — typed core platform table, extended per rev E section 4.3
// (#248 Slice D, 2026-08-31): is_person (person organization or not, section
// 2.7), org_type (vendor | customer | partner | branch | internal value set),
// parent_organization_id (set => branch, section 2.7). Multi-organization
// pattern locked (section 2.5): every content record hangs from an org.
export const organizations = pgTable(
  'organizations',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    name: text('name').notNull(),
    isPerson: boolean('is_person').notNull().default(false),
    orgType: text('org_type').notNull().default('internal'),
    parentOrganizationId: text('parent_organization_id').references(
      (): AnyPgColumn => organizations.id,
    ),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'organizations_org_type_check',
      sql`${table.orgType} IN ('vendor', 'customer', 'partner', 'branch', 'internal')`,
    ),
  ],
);

// Department
export const departments = pgTable(
  'departments',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('departments_org_code_idx').on(table.organizationId, table.code),
  ],
);

// User (pilot object — agents ARE users with type='agent')
export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role').notNull().default('member'),
    type: text('type').notNull().default('human'),
    status: text('status').notNull().default('active'),
    departmentId: text('department_id').references(() => departments.id),
    passwordHash: text('password_hash'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('users_role_check', sql`${table.role} IN ('admin', 'member')`),
    check('users_type_check', sql`${table.type} IN ('human', 'agent')`),
    check('users_status_check', sql`${table.status} IN ('active', 'inactive')`),
  ],
);

// Party (Collaboration zone — single table + party_kind)
export const parties = pgTable(
  'parties',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    partyKind: text('party_kind').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'parties_kind_check',
      sql`${table.partyKind} IN ('vendor', 'customer', 'partner', 'branch')`,
    ),
  ],
);

// Project
export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('active'),
    ownerUserId: text('owner_user_id').references(() => users.id),
    priority: text('priority').notNull().default('normal'),
    startDate: date('start_date'),
    targetDate: date('target_date'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'projects_status_check',
      sql`${table.status} IN ('active', 'paused', 'completed', 'archived')`,
    ),
    check(
      'projects_priority_check',
      sql`${table.priority} IN ('low', 'normal', 'high')`,
    ),
  ],
);

// Task
export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    projectId: text('project_id').notNull().references(() => projects.id),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('planned'),
    priority: text('priority').notNull().default('normal'),
    assigneeUserId: text('assignee_user_id').references(() => users.id),
    dueDate: date('due_date'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'tasks_status_check',
      sql`${table.status} IN ('planned', 'in_progress', 'waiting', 'blocked', 'done')`,
    ),
    check(
      'tasks_priority_check',
      sql`${table.priority} IN ('low', 'normal', 'high', 'urgent')`,
    ),
  ],
);

// Product
export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    organizationId: text('organization_id').notNull().references(() => organizations.id),
    name: text('name').notNull(),
    tagline: text('tagline').notNull().default(''),
    description: text('description').notNull().default(''),
    category: text('category'),
    status: text('status').notNull().default('available'),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'products_status_check',
      sql`${table.status} IN ('available', 'beta', 'coming-soon')`,
    ),
  ],
);

// Integration (Product 1:N Integrations)
export const integrations = pgTable(
  'integrations',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    productId: text('product_id').references(() => products.id),
    name: text('name').notNull(),
    type: text('type').notNull(),
    status: text('status').notNull().default('disconnected'),
    lastSync: timestamp('last_sync', { withTimezone: true }),
    description: text('description').notNull().default(''),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'integrations_type_check',
      sql`${table.type} IN ('email', 'cms', 'database', 'api', 'iot', 'messaging')`,
    ),
    check(
      'integrations_status_check',
      sql`${table.status} IN ('connected', 'disconnected', 'error')`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Catalog tables (metadata layer)
// ---------------------------------------------------------------------------

export const valueSet = pgTable('value_set', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  apiName: text('api_name').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull().default(''),
});

export const valueSetItem = pgTable(
  'value_set_item',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    valueSetId: text('value_set_id').notNull().references(() => valueSet.id),
    apiValue: text('api_value').notNull(),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('value_set_item_vs_api_idx').on(table.valueSetId, table.apiValue),
  ],
);

export const fieldDefinition = pgTable(
  'field_definition',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    objectApiName: text('object_api_name').notNull(),
    apiName: text('api_name').notNull(),
    label: text('label').notNull(),
    dataType: text('data_type').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    isRequired: boolean('is_required').notNull().default(false),
    defaultValue: text('default_value'),
    valueSetApiName: text('value_set_api_name'),
    lookupObjectApiName: text('lookup_object_api_name'),
    // #245 Slice E1 (rev E section 4.2 lookup_field, C2): delete rule for lookup
    // fields. NULL reads as the locked default 'orphan' (plain lookup);
    // 'cascade' (master-detail) is opt-in per field.
    lookupDeleteRule: text('lookup_delete_rule'),
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('field_def_obj_api_idx').on(table.objectApiName, table.apiName),
    check(
      'field_def_lookup_delete_rule_check',
      sql`${table.lookupDeleteRule} IS NULL OR ${table.lookupDeleteRule} IN ('cascade', 'orphan')`,
    ),
    check(
      'field_def_data_type_check',
      sql`${table.dataType} IN ('text', 'long_text', 'number', 'boolean', 'date', 'datetime', 'picklist', 'multipicklist', 'lookup', 'email', 'url', 'phone', 'currency')`,
    ),
  ],
);

export const layoutDefinition = pgTable(
  'layout_definition',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    objectApiName: text('object_api_name').notNull(),
    apiName: text('api_name').notNull(),
    label: text('label').notNull(),
    layoutType: text('layout_type').notNull(),
    version: integer('version').notNull().default(1),
    body: jsonb('body').notNull().default({}),
    isDefault: boolean('is_default').notNull().default(false),
  },
  (table) => [
    uniqueIndex('layout_def_obj_api_ver_idx').on(
      table.objectApiName,
      table.apiName,
      table.version,
    ),
    check(
      'layout_def_type_check',
      sql`${table.layoutType} IN ('detail', 'edit', 'list')`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Horizon 1 core persistence (#245 Slice E1, rev E section 4.2, 2026-08-31)
// record_type / record / record_line / record_relations - the data-model
// contract the zone elements spec locks. Elements are record TYPES; instances
// carry a header JSONB + lines; lookups between definitions via field
// definitions (lookup_object_api_name + lookup_delete_rule).
// ---------------------------------------------------------------------------

// Record type - one row per element/record definition. api_name is globally
// unique (spec section 4.2). parent_kind uses the codebase zone kinds:
// 'faculty' is the executive division (C8 keeps the legacy zone api_name
// prefix), alongside collaboration | environment | baked_in.
export const recordType = pgTable(
  'record_type',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    orgId: text('org_id').notNull().references(() => organizations.id),
    apiName: text('api_name').notNull().unique(),
    label: text('label').notNull(),
    parentKind: text('parent_kind').notNull(),
    parentApiName: text('parent_api_name').notNull(),
    structure: text('structure').notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'record_type_parent_kind_check',
      sql`${table.parentKind} IN ('faculty', 'collaboration', 'environment', 'baked_in')`,
    ),
    check(
      'record_type_structure_check',
      sql`${table.structure} IN ('list', 'header', 'header_lines')`,
    ),
  ],
);

// Record - one instance of a record type. header JSONB carries the field
// values per the type's field definitions (name/status included so the
// fixture-shaped API contract maps 1:1).
export const record = pgTable(
  'record',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    orgId: text('org_id').notNull().references(() => organizations.id),
    recordTypeId: text('record_type_id')
      .notNull()
      .references(() => recordType.id),
    header: jsonb('header').notNull().default({}),
    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('record_type_idx').on(table.recordTypeId)],
);

// Record line - lines under a record (structural, always cascade). #245 E1
// design note (C3 vendor integrations): the parent may alternatively be an
// organization - exactly one of record_id / organization_id is set. line_group
// is the lines-group api_name (e.g. 'milestones'); NULL reads as the legacy
// default group (policy) and is backfilled per COA note 3827.
export const recordLine = pgTable(
  'record_line',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    recordId: text('record_id').references(() => record.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    lineGroup: text('line_group'),
    position: integer('position').notNull().default(0),
    data: jsonb('data').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('record_line_record_idx').on(table.recordId),
    index('record_line_organization_idx').on(table.organizationId),
    check(
      'record_line_parent_check',
      sql`(${table.recordId} IS NULL) <> (${table.organizationId} IS NULL)`,
    ),
  ],
);

// Record relations - cross-record relations (executive one-to-many to parties
// + environment nodes, dissemination/qualification/product relations - spec
// section 6). relation_kind values come from the locked relation-kind value
// sets; stored as text per the field_definition.value_set_api_name soft-
// reference pattern (concrete kind seed arrives with the held matrix).
export const recordRelations = pgTable(
  'record_relations',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    orgId: text('org_id').notNull().references(() => organizations.id),
    sourceRecordId: text('source_record_id')
      .notNull()
      .references(() => record.id, { onDelete: 'cascade' }),
    targetRecordId: text('target_record_id').references(() => record.id, {
      onDelete: 'cascade',
    }),
    // #249 Slice E2 (rev E section 3.2 + C5): executive records relate to
    // organizations (vendor/customer/partner/branch) - organizations stay a
    // typed core table, so the org target is a column. Exactly one of
    // target_record_id / target_organization_id is set (CHECK below).
    targetOrganizationId: text('target_organization_id').references(
      () => organizations.id,
      { onDelete: 'cascade' },
    ),
    relationKind: text('relation_kind').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('record_relations_source_idx').on(table.sourceRecordId),
    index('record_relations_target_idx').on(table.targetRecordId),
    index('record_relations_target_org_idx').on(table.targetOrganizationId),
    check(
      'record_relations_target_check',
      sql`(${table.targetRecordId} IS NULL) <> (${table.targetOrganizationId} IS NULL)`,
    ),
  ],
);

// Element config - division configuration singleton (rev E section 4.5,
// section 2.6): the appointed staff member in charge of the division and
// their deputy, plus division-specific configuration JSONB. Unique per
// organization + division (element_api_name).
export const elementConfig = pgTable(
  'element_config',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
    orgId: text('org_id').notNull().references(() => organizations.id),
    elementApiName: text('element_api_name').notNull(),
    headUserId: text('head_user_id').references(() => users.id),
    deputyUserId: text('deputy_user_id').references(() => users.id),
    config: jsonb('config').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('element_config_org_element_idx').on(
      table.orgId,
      table.elementApiName,
    ),
  ],
);

// Site settings - instance-wide white-label singleton (#252 Settings
// functionality slice, Stephen round-2 item 10). Persisted branding:
// brand.name + colors.brand only (COA ruling S1 - exactly the 2 exposed
// controls; full token set is scope creep). Single row keyed by id='site'.
export const siteSettings = pgTable(
  'site_settings',
  {
    id: text('id').primaryKey(),
    brandName: text('brand_name').notNull(),
    brandColor: text('brand_color').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);
