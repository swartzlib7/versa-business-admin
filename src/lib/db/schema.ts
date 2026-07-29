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
  pgTable,
  text,
  jsonb,
  timestamp,
  date,
  integer,
  boolean,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Core entities (baseline ERD locked)
// ---------------------------------------------------------------------------

// Organization (singleton for v1; multi-tenant later)
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name').notNull(),
  data: jsonb('data').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

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
    kind: text('kind'),
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
    sortOrder: integer('sort_order').notNull().default(0),
    active: boolean('active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('field_def_obj_api_idx').on(table.objectApiName, table.apiName),
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
