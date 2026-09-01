// #249 Slice E2 sanity — structural assertions (no DB). Run: npx tsx __tmp/sanity_slice_e2.ts
import { readFileSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. Migration 0003 — element_config + record_relations org-target (rev E 4.5/3.2/C5)
const mig = rd('drizzle/0003_i5_6_33_slice_e2_element_config_relations.sql');
ok(mig.includes('CREATE TABLE "element_config"'), 'migration creates element_config');
ok(mig.includes('"element_api_name" text NOT NULL'), 'element_config element_api_name');
ok(mig.includes('"head_user_id" text'), 'element_config head_user_id');
ok(mig.includes('"deputy_user_id" text'), 'element_config deputy_user_id');
ok(mig.includes('"config" jsonb'), 'element_config config JSONB');
ok(mig.includes('CREATE UNIQUE INDEX "element_config_org_element_idx"'), 'element_config singleton unique index (org_id + element_api_name)');
ok(mig.includes('ALTER TABLE "record_relations" ALTER COLUMN "target_record_id" DROP NOT NULL'), 'record_relations.target_record_id now nullable');
ok(mig.includes('ADD COLUMN "target_organization_id"'), 'record_relations.target_organization_id added (C5)');
ok(mig.includes('record_relations_target_check'), 'record_relations XOR CHECK (exactly one target)');
ok(mig.includes('REFERENCES "public"."organizations"("id")'), 'org-target FK to organizations');

// 2. Schema exports
const schema = rd('src/lib/db/schema.ts');
ok(schema.includes('export const elementConfig = pgTable('), 'schema elementConfig');
ok(schema.includes('targetOrganizationId: text('), 'schema targetOrganizationId');
ok(schema.includes('record_relations_target_check'), 'schema XOR check');
ok(schema.includes('element_config_org_element_idx'), 'schema element_config unique index');

// 3. Records store — org auto-preset + relations write/read paths
const store = rd('src/lib/db/records-store.ts');
ok(store.includes('resolveOrgIdForCreate'), 'store: org auto-preset resolution');
ok(store.includes('default_organization_id'), 'store: user default org read from users.data');
ok(store.includes('orgId: orgResolved.orgId'), 'store: create stamps resolved org');
ok(store.includes('async function loadRelations'), 'store: relations read path');
ok(store.includes('target_kind: \'organization\''), 'store: org-target relation mapping');
ok(store.includes('target_kind: \'record\''), 'store: record-target relation mapping');
ok(store.includes('relations replace-in-full'), 'store: relations replace-in-full on update');
ok(store.includes('code: \'ORG_NOT_FOUND\''), 'store: org validation on create');
ok(store.includes('orgUpdate = { orgId: orgRows[0].id }'), 'store: org_id update validated');
ok(store.includes('org_id: row.orgId'), 'store: instance carries org_id');

// 4. Element-config store + API
const ec = rd('src/lib/db/element-config-store.ts');
ok(ec.includes('export async function getElementConfigDb'), 'element-config: get');
ok(ec.includes('export async function upsertElementConfigDb'), 'element-config: upsert');
ok(ec.includes('eq(elementConfigTable.elementApiName, elementApiName)'), 'element-config: keyed on org + element_api_name');
const ecRoute = rd('src/app/api/element-config/[element]/route.ts');
ok(ecRoute.includes('export async function GET'), 'element-config API: GET');
ok(ecRoute.includes('export async function PUT'), 'element-config API: PUT');
ok(ecRoute.includes('isAdmin(session)'), 'element-config API: admin-gated writes');
const relRoute = rd('src/app/api/records/[id]/relations/route.ts');
ok(relRoute.includes('outbound'), 'relations API: outbound');
ok(relRoute.includes('inbound'), 'relations API: inbound (both-way navigation)');

// 5. API passthrough (org_id + relations on POST/PATCH)
const postRoute = rd('src/app/api/records/route.ts');
ok(postRoute.includes('org_id: body.org_id != null ? String(body.org_id) : undefined'), 'records POST: org_id passthrough');
ok(postRoute.includes('relations: body.relations as'), 'records POST: relations passthrough');
const patchRoute = rd('src/app/api/records/[id]/route.ts');
ok(patchRoute.includes('org_id: body.org_id != null ? String(body.org_id) : undefined'), 'records PATCH: org_id passthrough');
ok(patchRoute.includes('relations: body.relations as'), 'records PATCH: relations passthrough');

// 6. UI wiring
const zcv = rd('src/components/zones/zone-config-view.tsx');
ok(zcv.includes('DivisionConfigPanel'), 'UI: DivisionConfigPanel rendered');
ok(zcv.includes('RecordRelationsPanel'), 'UI: RecordRelationsPanel on detail view');
ok(zcv.includes('DIVISION_IDS'), 'UI: division self panels keyed');
ok(zcv.includes('orgOptions.length > 1'), 'UI: org dropdown editable when multiple orgs');
ok(zcv.includes('readOnly'), 'UI: org read-only when single org');
const ecp = rd('src/components/zones/element-config-panel.tsx');
ok(ecp.includes('head_user_id'), 'UI: division head select');
ok(ecp.includes('deputy_user_id'), 'UI: deputy select');
ok(ecp.includes('/api/records/\' + encodeURIComponent(recordId) + \'/relations\''), 'UI: relations fetch');

// 7. Journal updated
const journal = rd('drizzle/meta/_journal.json');
ok(journal.includes('0003_i5_6_33_slice_e2_element_config_relations'), 'drizzle journal has 0003 entry');

console.log('Slice E2 sanity: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
