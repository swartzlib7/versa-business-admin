// #244 Slice F sanity — structural assertions (no DB). Run: npx tsx __tmp/sanity_slice_f.ts
import { readFileSync } from 'fs';
let pass = 0, fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); }
}
const rd = (p: string) => readFileSync(p, 'utf8');

// 1. D1 cutover — vendor_integration retired everywhere
const rt = rd('src/lib/fixtures/record-types.ts');
ok(!rt.includes("api_name: 'vendor_integration'"), 'seed: vendor_integration type removed');
ok(rt.includes('vendor_integration retired in #244 Slice F'), 'seed: cutover comment present');
const cat = rd('src/lib/fixtures/catalog.ts');
ok(!cat.includes("object_api_name: 'vendor_integration'"), 'catalog: vendor_integration field defs removed');
ok(cat.includes("lookup_delete_rule?: 'cascade' | 'orphan' | null"), 'catalog: FieldDefinition.lookup_delete_rule');
ok(cat.includes("code: 'INVALID_DELETE_RULE'"), 'catalog: delete-rule validation');
ok(rt.includes("code: 'LABEL_EXISTS'"), 'record-types: label-unique-within-parent (rev E 2.4)');
const tabs = rd('src/lib/zones/record-type-tabs.ts');
ok(!tabs.includes('integrations: "vendor_integration"'), 'tabs: no vendor_integration wiring entries');

// 2. Zone definitions — rotation fix + org-lines marker
const zd = rd('src/lib/zones/zone-definitions.ts');
ok(zd.includes('orgLinesGroup: "integrations"'), 'zone-definitions: vendor integrations child orgLinesGroup marker');
const zcv = rd('src/components/zones/zone-config-view.tsx');
ok(zcv.includes('function OrgLinesPanel'), 'zone-config-view: OrgLinesPanel component');
ok(zcv.includes('panel.orgLinesGroup ?'), 'zone-config-view: org-lines render branch');
ok(zcv.includes('orgLinesGroup: tab.orgLinesGroup'), 'zone-config-view: selfPanel forwards orgLinesGroup');
ok(zcv.includes('orgTypePanel: tab.orgTypePanel'), 'zone-config-view: selfPanel forwards orgTypePanel (latent bug 1 fix)');
ok(zcv.includes('label: isOrganizationsSelf ? "Organizations" : "Records"'), 'zone-config-view: self label Records (round-2 item 3)');

// 3. Org-lines stack — store + adapter + API + fixture
const store = rd('src/lib/db/records-store.ts');
ok(store.includes('export async function listOrgLinesDb'), 'store: listOrgLinesDb');
ok(store.includes('export async function createOrgLineDb'), 'store: createOrgLineDb');
ok(store.includes('export async function updateOrgLineDb'), 'store: updateOrgLineDb');
ok(store.includes('export async function deleteOrgLineDb'), 'store: deleteOrgLineDb');
ok(store.includes('eq(recordLineTable.lineGroup, lineGroup)'), 'store: keyed on organization + line_group');
const ad = rd('src/lib/data/adapter.ts');
ok(ad.includes('listOrgLines?('), 'adapter interface: listOrgLines');
ok(ad.includes('createOrgLine?('), 'adapter interface: createOrgLine');
ok(ad.includes('updateOrgLine?('), 'adapter interface: updateOrgLine');
ok(ad.includes('deleteOrgLine?('), 'adapter interface: deleteOrgLine');
ok(ad.includes('async listOrgLines(organizationId'), 'fixtureAdapter: listOrgLines');
ok(ad.includes('listOrgLines: (organizationId'), 'postgresAdapter: listOrgLines');
ok(ad.includes('if (!res.ok) throw new Error(res.message);'), 'postgresAdapter: createOrgLine error unwrap');
const linesRoute = rd('src/app/api/organizations/[id]/lines/route.ts');
ok(linesRoute.includes('export async function GET'), 'org-lines API: GET');
ok(linesRoute.includes('export async function POST'), 'org-lines API: POST');
ok(linesRoute.includes('export async function PATCH'), 'org-lines API: PATCH');
ok(linesRoute.includes('export async function DELETE'), 'org-lines API: DELETE');
ok(linesRoute.includes('isAdmin(session)'), 'org-lines API: admin-gated writes');
ok(linesRoute.includes("?? 'integrations'"), 'org-lines API: default group integrations');
const ri = rd('src/lib/fixtures/record-instances.ts');
ok(ri.includes('export function listOrgLines'), 'fixture: listOrgLines');
ok(ri.includes('export function createOrgLine'), 'fixture: createOrgLine');
ok(ri.includes('export function updateOrgLine'), 'fixture: updateOrgLine');
ok(ri.includes('export function deleteOrgLine'), 'fixture: deleteOrgLine');

// 4. Fixture org latent-bug repair (beta :3200 runs fixture mode)
ok(ad.includes('const mutableOrganizations: Organization[] = ['), 'fixtureAdapter: in-memory orgs store');
ok(ad.includes('async listOrganizations(orgType?: string)'), 'fixtureAdapter: listOrganizations');
ok(ad.includes('async getOrganization(id: string)'), 'fixtureAdapter: getOrganization');
ok(ad.includes('async createOrganization(input: CreateOrganizationInput)'), 'fixtureAdapter: createOrganization');
ok(ad.includes('async updateOrganization(id: string, input: UpdateOrganizationInput)'), 'fixtureAdapter: updateOrganization');

// 5. Deep-link consumer (E2-3) + lookup_delete_rule UI
const re = rd('src/components/settings/records-editor.tsx');
ok(re.includes("searchParams.get('record')"), 'records-editor: ?record= deep-link consumer');
ok(re.includes('searchParams.get("parent")'), 'records-editor: ?parent= filter (existing)');
ok(re.includes('lookup_delete_rule'), 'records-editor: lookup_delete_rule UI');
ok(re.includes('Lookup delete rule'), 'records-editor: delete-rule select label');
ok(re.includes('Orphan (plain lookup)'), 'records-editor: orphan option');
ok(re.includes('Cascade (master-detail)'), 'records-editor: cascade option');

// 6. Migration 0004 — vendor_integration rows to org-attached lines
const mig = rd('drizzle/0004_i5_6_33_slice_f_vendor_integration_cutover.sql');
ok(mig.includes('INSERT INTO "record_line"'), 'migration 0004: INSERT INTO record_line');
ok(mig.includes("'integrations'"), 'migration 0004: line_group integrations');
ok(mig.includes("rt.\"api_name\" = 'vendor_integration'"), 'migration 0004: selects vendor_integration records');
ok(mig.includes('DELETE FROM "record_type"'), 'migration 0004: retires record_type row');
ok(mig.includes('jsonb_build_object'), 'migration 0004: header fields to line data');
const journal = JSON.parse(rd('drizzle/meta/_journal.json'));
ok(journal.entries.some((e: { tag: string }) => e.tag === '0004_i5_6_33_slice_f_vendor_integration_cutover'), 'journal: 0004 registered');

// 7. Fields route passthrough
const fr = rd('src/app/api/catalog/fields/route.ts');
ok(fr.includes('lookup_delete_rule: body.lookup_delete_rule'), 'fields route: lookup_delete_rule passthrough');

// 8. Sanity flips (D1 assertions now assert retirement)
const sa = rd('__tmp/sanity_slice_a.ts');
ok(sa.includes("struct['vendor_integration'] === undefined"), 'sanity A: flipped to retirement');
const sc = rd('__tmp/sanity_slice_c.ts');
ok(sc.includes("byApi['vendor_integration'] === undefined"), 'sanity C: flipped to retirement');
ok(sc.includes('!tabs.includes'), 'sanity C: wiring flip');

console.log('Slice F sanity: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
