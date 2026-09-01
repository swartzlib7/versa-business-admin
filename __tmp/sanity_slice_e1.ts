// #245 Slice E1 sanity — structural assertions (no DB). Run: npx tsx __tmp/sanity_slice_e1.ts
import { readFileSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. Migration 0002 — Horizon 1 tables per rev E section 4.2
const mig = rd('drizzle/0002_i5_6_33_slice_e1_horizon1_record_tables.sql');
ok(mig.includes('CREATE TABLE "record_type"'), 'migration creates record_type');
ok(mig.includes('CREATE TABLE "record"'), 'migration creates record');
ok(mig.includes('CREATE TABLE "record_line"'), 'migration creates record_line');
ok(mig.includes('CREATE TABLE "record_relations"'), 'migration creates record_relations');
ok(mig.includes('"api_name" text NOT NULL'), 'record_type api_name column');
ok(mig.includes('CONSTRAINT "record_type_api_name_unique" UNIQUE("api_name")'), 'record_type api_name globally unique');
ok(mig.includes("'faculty', 'collaboration', 'environment', 'baked_in'"), 'record_type parent_kind check (faculty = executive division per C8)');
ok(mig.includes("'list', 'header', 'header_lines'"), 'record_type structure check');
ok(mig.includes('REFERENCES "public"."organizations"("id")'), 'org_id FKs to organizations');
ok(mig.includes('REFERENCES "public"."record_type"("id")'), 'record.record_type_id FK');
ok(mig.includes('REFERENCES "public"."users"("id")'), 'record.created_by FK to users');
ok(mig.includes('ON DELETE cascade'), 'record_line cascade delete');
ok(mig.includes('"line_group" text'), 'record_line.line_group column');
ok(mig.includes('"position" integer'), 'record_line.position column');
ok(mig.includes('"organization_id" text'), 'record_line.organization_id nullable column (C3 design note)');
ok(mig.includes('record_line_parent_check'), 'record_line exactly-one-parent check');
ok(mig.includes('"relation_kind" text NOT NULL'), 'record_relations.relation_kind');
ok(mig.includes('ADD COLUMN "lookup_delete_rule" text'), 'field_definition.lookup_delete_rule added');
ok(mig.includes("'cascade', 'orphan'"), 'lookup_delete_rule check (C2: orphan default, cascade opt-in)');

// 2. Schema exports
const schema = rd('src/lib/db/schema.ts');
ok(schema.includes('export const recordType = pgTable('), 'schema recordType');
ok(schema.includes('export const record = pgTable('), 'schema record');
ok(schema.includes('export const recordLine = pgTable('), 'schema recordLine');
ok(schema.includes('export const recordRelations = pgTable('), 'schema recordRelations');
ok(schema.includes('lookupDeleteRule: text('), 'schema lookupDeleteRule');
ok(schema.includes('organizationId: text('), 'schema recordLine organizationId');
ok(schema.includes("{ onDelete: 'cascade' }"), 'schema cascade delete refs');

// 3. Records store — migration + backfill + CRUD semantics
const store = rd('src/lib/db/records-store.ts');
ok(store.includes('export async function ensureRecordTypesFromRegistry'), 'store: system-type migration');
ok(store.includes('export async function backfillDefaultLineGroups'), 'store: line_group backfill (COA note 3827)');
ok(store.includes("prefix === 'line' ? null : prefix + 's'"), 'store: first-group derivation matches zone-config-view (uniform prefix+s)');
ok(store.includes("structure !== 'header_lines'"), 'store: backfill scoped to header_lines types');
ok(store.includes('header.name = input.name.trim()'), 'store: header name stamping');
ok(store.includes("header.status = input.status || 'active'"), 'store: header status stamping');
ok(store.includes('createdBy: opts?.createdBy ?? null'), 'store: created_by from session');
ok(store.includes('lineGroup: lineData.line_group ?? null'), 'store: line_group persisted');
ok(store.includes('position: (idx + 1) * 10'), 'store: position ordering matches fixture convention');
ok(store.includes("code: 'TYPE_NOT_FOUND'"), 'store: unregistered type rejected');
ok(store.includes('db.delete(recordLineTable).where(eq(recordLineTable.recordId, id))'), 'store: lines replace-in-full (fixture semantics)');

// 4. Adapter contract + postgres wiring
const adapter = rd('src/lib/data/adapter.ts');
for (const m of ['listRecords?', 'getRecord?', 'createRecord?', 'updateRecord?', 'deleteRecord?']) {
  ok(adapter.includes(m), 'adapter interface: ' + m);
}
ok(adapter.includes('listRecordsDb'), 'adapter postgres: listRecords');
ok(adapter.includes('createRecordDb'), 'adapter postgres: createRecord');
ok(adapter.includes('updateRecordDb'), 'adapter postgres: updateRecord');
ok(adapter.includes('deleteRecordDb'), 'adapter postgres: deleteRecord');

// 5. Routes — adapter-first with fixture fallback
const route = rd('src/app/api/records/route.ts');
ok(route.includes('adapter.listRecords'), 'records GET: adapter branch');
ok(route.includes('horizon1_db'), 'records GET: persistence meta');
ok(route.includes('listInstances(filters)'), 'records GET: fixture fallback intact');
ok(route.includes('adapter.createRecord'), 'records POST: adapter branch');
ok(route.includes('createdBy: session?.userId ?? null'), 'records POST: created_by from session');
ok(route.includes('createInstance(input)'), 'records POST: fixture fallback intact');
const idRoute = rd('src/app/api/records/[id]/route.ts');
ok(idRoute.includes('adapter.getRecord'), 'record GET:id adapter branch');
ok(idRoute.includes('adapter.updateRecord'), 'record PATCH adapter branch');
ok(idRoute.includes('adapter.deleteRecord'), 'record DELETE adapter branch');
ok(idRoute.includes('updateInstance(id, input)'), 'record PATCH fixture fallback intact');

// 6. Scope guard — fixture files untouched (registry stays source of truth)
import { execSync } from 'child_process';
const changed = execSync('git diff --name-only HEAD').toString().split('\n');
ok(!changed.some((f: string) => f.includes('src/lib/fixtures/record-instances.ts')), 'scope: record-instances.ts untouched');
ok(!changed.some((f: string) => f.includes('src/lib/fixtures/record-types.ts')), 'scope: record-types.ts untouched');
ok(!changed.some((f: string) => f.includes('zone-config-view')), 'scope: no UI drift into E2 territory');

// 7. Journal updated
const journal = rd('drizzle/meta/_journal.json');
ok(journal.includes('0002_i5_6_33_slice_e1_horizon1_record_tables'), 'drizzle journal has 0002 entry');

console.log(`Slice E1 sanity: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
