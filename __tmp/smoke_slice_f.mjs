// #244 Slice F live smoke - VM Postgres (E2 pattern: verify, restore, zero residue).
import postgres from 'postgres';
const sql = postgres('postgresql://mission:mission@localhost:5432/mission_control');
let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; } else { fail++; console.log('FAIL: ' + l); } };

await sql.unsafe("INSERT INTO organizations (id, name, org_type, is_person) VALUES ('smoke-org-f', 'Smoke Vendor F', 'vendor', false) ON CONFLICT (id) DO NOTHING");

const ins = await sql.unsafe(
  "INSERT INTO record_line (organization_id, line_group, position, data) SELECT 'smoke-org-f', 'integrations', COALESCE(MAX(position), -1) + 1, $1 FROM record_line WHERE organization_id = 'smoke-org-f' AND line_group = 'integrations' RETURNING id, position",
  [JSON.stringify({ name: 'Smoke Integration', kind: 'api', status: 'active' })],
);
ok(ins.length === 1, 'line insert');
const lineId = ins[0].id;

const got = await sql.unsafe("SELECT id, data FROM record_line WHERE organization_id = 'smoke-org-f' AND line_group = 'integrations' ORDER BY position");
// postgres.js unsafe returns jsonb as a string; drizzle (product path) parses it.
const gotData = typeof got[0].data === 'string' ? JSON.parse(got[0].data) : got[0].data;
ok(got.length === 1 && gotData.name === 'Smoke Integration', 'line read back');

const upd = await sql.unsafe(
  "UPDATE record_line SET data = $1, updated_at = NOW() WHERE id = $2 AND organization_id = 'smoke-org-f' AND line_group = 'integrations' RETURNING id",
  [JSON.stringify({ name: 'Smoke Integration 2', kind: 'api', status: 'inactive' }), lineId],
);
ok(upd.length === 1, 'line update');

let xorRejected = false;
try {
  await sql.unsafe("INSERT INTO record_line (record_id, organization_id, line_group, position, data) VALUES ('smoke-rec-e2', 'smoke-org-f', 'integrations', 0, '{}')");
} catch { xorRejected = true; }
ok(xorRejected, 'XOR CHECK rejects dual parent');

const del = await sql.unsafe("DELETE FROM record_line WHERE id = $1 RETURNING id", [lineId]);
ok(del.length === 1, 'line delete');

const residue = await sql.unsafe("SELECT count(*)::int AS c FROM record_line WHERE organization_id = 'smoke-org-f'");
ok(residue[0].c === 0, 'zero line residue');
await sql.unsafe("DELETE FROM organizations WHERE id = 'smoke-org-f'");
const orgResidue = await sql.unsafe("SELECT count(*)::int AS c FROM organizations WHERE id = 'smoke-org-f'");
ok(orgResidue[0].c === 0, 'zero org residue');

console.log('Slice F live smoke: ' + pass + ' passed, ' + fail + ' failed');
await sql.end();
process.exit(fail > 0 ? 1 : 0);
