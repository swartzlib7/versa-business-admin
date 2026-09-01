// #249 Slice E2 live smoke - VM Postgres (E1 pattern: migrate, verify, restore).
import postgres from 'postgres';
const sql = postgres('postgresql://mission:mission@localhost:5432/mission_control');
let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; } else { fail++; console.log('FAIL: ' + label); } };

// 1. element_config table + singleton constraint
const ec = await sql.unsafe("SELECT column_name FROM information_schema.columns WHERE table_name='element_config' ORDER BY ordinal_position");
const ecCols = ec.map((r) => r.column_name);
ok(ecCols.includes('org_id') && ecCols.includes('element_api_name') && ecCols.includes('head_user_id') && ecCols.includes('deputy_user_id') && ecCols.includes('config'), 'element_config columns present');
const uq = await sql.unsafe("SELECT indexname FROM pg_indexes WHERE tablename='element_config'");
ok(uq.some((r) => r.indexname === 'element_config_org_element_idx'), 'element_config unique index (singleton)');

// 2. record_relations org-target + XOR CHECK
const rr = await sql.unsafe("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='record_relations'");
const rrMap = Object.fromEntries(rr.map((r) => [r.column_name, r.is_nullable]));
ok(rrMap.target_record_id === 'YES', 'record_relations.target_record_id nullable');
ok(rrMap.target_organization_id === 'YES', 'record_relations.target_organization_id present');
const chk = await sql.unsafe("SELECT conname FROM pg_constraint WHERE conname='record_relations_target_check'");
ok(chk.length === 1, 'record_relations XOR CHECK exists');

// 3. element_config singleton upsert behavior
await sql.unsafe("INSERT INTO organizations (id, name, org_type, is_person) VALUES ('smoke-org-e2', 'Smoke Org E2', 'internal', false) ON CONFLICT (id) DO NOTHING");
await sql.unsafe("INSERT INTO users (id, email, name, role, type, status, data) VALUES ('smoke-user-e2', 'smoke-e2@test.local', 'Smoke User E2', 'admin', 'human', 'active', '{}') ON CONFLICT (id) DO NOTHING");
await sql.unsafe("DELETE FROM element_config WHERE org_id='smoke-org-e2'");
await sql.unsafe("INSERT INTO element_config (org_id, element_api_name, head_user_id, deputy_user_id, config) VALUES ('smoke-org-e2', 'executive', 'smoke-user-e2', NULL, '{}')");
const ecRow = await sql.unsafe("SELECT head_user_id FROM element_config WHERE org_id='smoke-org-e2' AND element_api_name='executive'");
ok(ecRow.length === 1 && ecRow[0].head_user_id === 'smoke-user-e2', 'element_config insert + read');
let dupRejected = false;
try {
  await sql.unsafe("INSERT INTO element_config (org_id, element_api_name, head_user_id, deputy_user_id, config) VALUES ('smoke-org-e2', 'executive', NULL, NULL, '{}')");
} catch { dupRejected = true; }
ok(dupRejected, 'element_config duplicate rejected (singleton enforced)');

// 4. record_relations XOR CHECK behavior
await sql.unsafe("INSERT INTO record_type (id, api_name, label, parent_kind, parent_api_name, structure, org_id) VALUES ('smoke-rt-e2', 'smoke_type_e2', 'Smoke Type E2', 'baked_in', 'baked', 'list', 'smoke-org-e2') ON CONFLICT (api_name) DO NOTHING");
const rt = await sql.unsafe("SELECT id FROM record_type WHERE api_name='smoke_type_e2'");
const rtId = rt[0].id;
await sql.unsafe("INSERT INTO record (id, org_id, record_type_id, header, created_by) VALUES ('smoke-rec-e2', 'smoke-org-e2', $1, $2, NULL), ('smoke-rec-e2b', 'smoke-org-e2', $1, $3, NULL)", [rtId, JSON.stringify({ name: 'Smoke Rec E2' }), JSON.stringify({ name: 'Smoke Rec B' })]);
await sql.unsafe("DELETE FROM record_relations WHERE source_record_id='smoke-rec-e2'");
await sql.unsafe("INSERT INTO record_relations (org_id, source_record_id, target_organization_id, relation_kind) VALUES ('smoke-org-e2', 'smoke-rec-e2', 'smoke-org-e2', 'related')");
const relRow = await sql.unsafe("SELECT target_organization_id FROM record_relations WHERE source_record_id='smoke-rec-e2'");
ok(relRow.length === 1 && relRow[0].target_organization_id === 'smoke-org-e2', 'org-target relation insert');
let xorRejected = false;
try {
  await sql.unsafe("INSERT INTO record_relations (org_id, source_record_id, target_record_id, target_organization_id, relation_kind) VALUES ('smoke-org-e2', 'smoke-rec-e2', 'smoke-rec-e2b', 'smoke-org-e2', 'related')");
} catch { xorRejected = true; }
ok(xorRejected, 'XOR CHECK rejects both-targets row');
let bothNullRejected = false;
try {
  await sql.unsafe("INSERT INTO record_relations (org_id, source_record_id, relation_kind) VALUES ('smoke-org-e2', 'smoke-rec-e2', 'related')");
} catch { bothNullRejected = true; }
ok(bothNullRejected, 'XOR CHECK rejects both-null row');

// 5. Cleanup (restore environment)
await sql.unsafe("DELETE FROM record_relations WHERE source_record_id IN ('smoke-rec-e2','smoke-rec-e2b')");
await sql.unsafe("DELETE FROM record WHERE id IN ('smoke-rec-e2','smoke-rec-e2b')");
await sql.unsafe("DELETE FROM record_type WHERE api_name='smoke_type_e2'");
await sql.unsafe("DELETE FROM element_config WHERE org_id='smoke-org-e2'");
await sql.unsafe("DELETE FROM users WHERE id='smoke-user-e2'");
await sql.unsafe("DELETE FROM organizations WHERE id='smoke-org-e2'");
await sql.end();
console.log('Slice E2 live smoke: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
