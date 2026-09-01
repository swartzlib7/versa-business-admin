// #252 Settings slice live smoke - VM Postgres (verify, restore, zero residue).
import postgres from 'postgres';
const sql = postgres('postgresql://mission:mission@localhost:5432/mission_control');
let pass = 0, fail = 0;
const ok = (c, l) => { if (c) { pass++; } else { fail++; console.log('FAIL: ' + l); } };

// 1. Table exists (migration 0005 applied)
const tbl = await sql.unsafe("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'site_settings' ORDER BY ordinal_position");
ok(tbl.length === 4, 'site_settings table exists with 4 columns');
ok(tbl.some(c => c.column_name === 'brand_name' && c.data_type === 'text'), 'brand_name text column');
ok(tbl.some(c => c.column_name === 'brand_color' && c.data_type === 'text'), 'brand_color text column');

// 2. GET-before-PUT semantics: no row -> store returns static defaults (S5)
const before = await sql.unsafe("SELECT * FROM site_settings WHERE id = 'site'");
ok(before.length === 0, 'singleton unset before smoke');

// 3. Insert singleton (upsert path)
await sql.unsafe("INSERT INTO site_settings (id, brand_name, brand_color) VALUES ('site', 'Smoke Brand', '#ff5a5f') ON CONFLICT (id) DO UPDATE SET brand_name = EXCLUDED.brand_name, brand_color = EXCLUDED.brand_color, updated_at = NOW()");
const after = await sql.unsafe("SELECT brand_name, brand_color FROM site_settings WHERE id = 'site'");
ok(after.length === 1 && after[0].brand_name === 'Smoke Brand', 'singleton insert');
ok(after[0].brand_color === '#ff5a5f', 'brand_color persisted');

// 4. Update path (second PUT = UPDATE branch)
await sql.unsafe("UPDATE site_settings SET brand_name = 'Smoke Brand 2', updated_at = NOW() WHERE id = 'site'");
const upd = await sql.unsafe("SELECT brand_name FROM site_settings WHERE id = 'site'");
ok(upd[0].brand_name === 'Smoke Brand 2', 'singleton update');

// 5. Zero residue - restore pre-smoke state
await sql.unsafe("DELETE FROM site_settings WHERE id = 'site'");
const clean = await sql.unsafe("SELECT * FROM site_settings");
ok(clean.length === 0, 'zero residue after smoke');

console.log('Slice Settings smoke: ' + pass + ' passed, ' + fail + ' failed');
await sql.end();
process.exit(fail > 0 ? 1 : 0);
