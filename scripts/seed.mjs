#!/usr/bin/env node
/**
 * Phase 2 seed — org, departments, users (bcrypt hashes).
 * Idempotent upserts by primary key. Fixtures remain source of truth.
 * Usage: DATABASE_URL=... node scripts/seed.mjs
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "postgresql://mission:mission@localhost:5432/mission_control";
const sql = postgres(url, { max: 1 });

const ORG = { id: "org-1", name: "Sample Maker Workspace", data: { tagline: "Mission Control demo org" } };

const DEPARTMENTS = [
  { id: "dept-leadership", code: "leadership", name: "Leadership" },
  { id: "dept-operations", code: "operations", name: "Operations" },
  { id: "dept-research", code: "research", name: "Research" },
  { id: "dept-customer", code: "customer", name: "Customer" },
  { id: "dept-outreach", code: "outreach", name: "Outreach" },
];

const USERS = [
  { id: "user-1", email: "admin@example.com", name: "Alex Morgan", role: "admin", type: "human", status: "active", departmentId: "dept-leadership", password: "mission2026", data: { job_title: "Founder", department: "Leadership", bio: "Founder and producer for the sample maker workspace." } },
  { id: "user-2", email: "ops-assistant@example.com", name: "Ops Assistant", role: "admin", type: "agent", status: "active", departmentId: "dept-operations", password: "mission2026", data: { job_title: "Sample agent", department: "Operations", bio: "Sample agent account with admin role for demos." } },
  { id: "user-3", email: "member@example.com", name: "Jordan Lee", role: "member", type: "human", status: "active", departmentId: "dept-operations", password: "mission2026", data: { job_title: "Operations lead", department: "Operations", bio: "Operations lead keeping production on cadence." } },
  { id: "user-4", email: "research@example.com", name: "Research Assistant", role: "member", type: "agent", status: "active", departmentId: "dept-research", password: "mission2026", data: { job_title: "Sample agent", department: "Research", bio: "Sample agent account with member role." } },
  { id: "user-5", email: "success@example.com", name: "Casey Nguyen", role: "member", type: "human", status: "active", departmentId: "dept-customer", password: "mission2026", data: { job_title: "Customer partner", department: "Customer", bio: "Customer partner helping buyers adopt what we ship." } },
  { id: "user-6", email: "marketing@example.com", name: "Riley Brooks", role: "member", type: "human", status: "active", departmentId: "dept-outreach", password: "mission2026", data: { job_title: "Marketing", department: "Outreach", bio: "Marketing voice for the sample workspace." } },
];

async function main() {
  console.log("Seeding mission_control at", url.replace(/:[^:@/]+@/, ":***@"));
  await sql`
    INSERT INTO organizations (id, name, data)
    VALUES (${ORG.id}, ${ORG.name}, ${sql.json(ORG.data)})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
  `;
  console.log("org ok");
  for (const d of DEPARTMENTS) {
    await sql`
      INSERT INTO departments (id, organization_id, code, name, data)
      VALUES (${d.id}, ${ORG.id}, ${d.code}, ${d.name}, ${sql.json({})})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, updated_at = now()
    `;
  }
  console.log("departments", DEPARTMENTS.length);
  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    await sql`
      INSERT INTO users (id, email, name, role, type, status, department_id, password_hash, data)
      VALUES (${u.id}, ${u.email}, ${u.name}, ${u.role}, ${u.type}, ${u.status}, ${u.departmentId}, ${hash}, ${sql.json(u.data)})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        type = EXCLUDED.type,
        status = EXCLUDED.status,
        department_id = EXCLUDED.department_id,
        password_hash = EXCLUDED.password_hash,
        data = EXCLUDED.data,
        updated_at = now()
    `;
  }
  console.log("users", USERS.length);
  const rows = await sql`SELECT id, email, role, type FROM users ORDER BY id`;
  console.table(rows);
  await sql.end();
  console.log("DONE");
}

main().catch(async (err) => { console.error(err); try { await sql.end(); } catch {} process.exit(1); });
