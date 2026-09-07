#!/usr/bin/env node
/**
 * Install-only bootstrap seed — Primary Org + first admin + value-set catalog.
 *
 * Demo workspace content (demo orgs, departments, extra users, projects, tasks,
 * products, integrations) is NOT seeded. Insert it at runtime via
 * Settings → Modes → Insert Sample Data: live rows tagged external_id
 * `mc_sample:…` from src/lib/sample-data/pack.ts (Delete removes only those).
 *
 * Idempotent and install-only:
 *  - Value sets / items: upsert by stable id (catalog maintenance is safe).
 *  - Primary Org + first admin: INSERT ... ON CONFLICT DO NOTHING — re-runs
 *    never modify an existing tenant's org or accounts.
 *
 * Usage: DATABASE_URL=... node scripts/seed.mjs
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "postgresql://mission:mission@localhost:5432/mission_control";
const sql = postgres(url, { max: 1 });

// --- Primary Org (install bootstrap; rename in Settings after first login) ---
const ORG = { id: "org-1", name: "Primary Org", data: {} };

// --- First admin (fixture password; see docs/ops/MISSION_CONTROL_OPS_MANUAL.md) ---
const ADMIN = {
  id: "user-1",
  email: "admin@example.com",
  name: "Administrator",
  role: "admin",
  type: "human",
  status: "active",
  password: "mission2026",
  data: { job_title: "Workspace administrator" },
};

// --- Value-set catalog (Records Editor pre-configured value sets) ---
const VALUE_SETS = [
  { id: "vs-user-status", api_name: "user_status", label: "User status", description: "Active lifecycle for User (pilot picklist example)" },
  { id: "vs-user-role", api_name: "user_role", label: "User role", description: "RBAC role codes for User" },
  { id: "vs-project-status", api_name: "project_status", label: "Project status", description: "Lifecycle for Project" },
  { id: "vs-project-priority", api_name: "project_priority", label: "Project priority", description: "Priority for Project" },
  { id: "vs-task-status", api_name: "task_status", label: "Task status", description: "Lifecycle for Task" },
  { id: "vs-task-priority", api_name: "task_priority", label: "Task priority", description: "Priority for Task" },
  { id: "vs-product-status", api_name: "product_status", label: "Product status", description: "Availability for Product" },
  { id: "vs-product-category", api_name: "product_category", label: "Product category", description: "Catalog category for Product" },
];

const VALUE_SET_ITEMS = [
  { id: "vsi-us-active", value_set_id: "vs-user-status", api_value: "active", label: "Active", sort_order: 10, active: true },
  { id: "vsi-us-inactive", value_set_id: "vs-user-status", api_value: "inactive", label: "Inactive", sort_order: 20, active: true },
  { id: "vsi-ur-admin", value_set_id: "vs-user-role", api_value: "admin", label: "Admin", sort_order: 10, active: true },
  { id: "vsi-ur-member", value_set_id: "vs-user-role", api_value: "member", label: "Member", sort_order: 20, active: true },
  { id: "vsi-ps-active", value_set_id: "vs-project-status", api_value: "active", label: "Active", sort_order: 10, active: true },
  { id: "vsi-ps-paused", value_set_id: "vs-project-status", api_value: "paused", label: "Paused", sort_order: 20, active: true },
  { id: "vsi-ps-completed", value_set_id: "vs-project-status", api_value: "completed", label: "Completed", sort_order: 30, active: true },
  { id: "vsi-ps-archived", value_set_id: "vs-project-status", api_value: "archived", label: "Archived", sort_order: 40, active: true },
  { id: "vsi-pp-low", value_set_id: "vs-project-priority", api_value: "low", label: "Low", sort_order: 10, active: true },
  { id: "vsi-pp-normal", value_set_id: "vs-project-priority", api_value: "normal", label: "Normal", sort_order: 20, active: true },
  { id: "vsi-pp-high", value_set_id: "vs-project-priority", api_value: "high", label: "High", sort_order: 30, active: true },
  { id: "vsi-ts-planned", value_set_id: "vs-task-status", api_value: "planned", label: "Planned", sort_order: 10, active: true },
  { id: "vsi-ts-in_progress", value_set_id: "vs-task-status", api_value: "in_progress", label: "In progress", sort_order: 20, active: true },
  { id: "vsi-ts-waiting", value_set_id: "vs-task-status", api_value: "waiting", label: "Waiting", sort_order: 30, active: true },
  { id: "vsi-ts-blocked", value_set_id: "vs-task-status", api_value: "blocked", label: "Blocked", sort_order: 40, active: true },
  { id: "vsi-ts-done", value_set_id: "vs-task-status", api_value: "done", label: "Done", sort_order: 50, active: true },
  { id: "vsi-tp-low", value_set_id: "vs-task-priority", api_value: "low", label: "Low", sort_order: 10, active: true },
  { id: "vsi-tp-normal", value_set_id: "vs-task-priority", api_value: "normal", label: "Normal", sort_order: 20, active: true },
  { id: "vsi-tp-high", value_set_id: "vs-task-priority", api_value: "high", label: "High", sort_order: 30, active: true },
  { id: "vsi-tp-urgent", value_set_id: "vs-task-priority", api_value: "urgent", label: "Urgent", sort_order: 40, active: true },
  { id: "vsi-prs-available", value_set_id: "vs-product-status", api_value: "available", label: "Available", sort_order: 10, active: true },
  { id: "vsi-prs-beta", value_set_id: "vs-product-status", api_value: "beta", label: "Beta", sort_order: 20, active: true },
  { id: "vsi-prs-coming", value_set_id: "vs-product-status", api_value: "coming-soon", label: "Coming soon", sort_order: 30, active: true },
  { id: "vsi-pc-packages", value_set_id: "vs-product-category", api_value: "Packages", label: "Packages", sort_order: 10, active: true },
  { id: "vsi-pc-platform", value_set_id: "vs-product-category", api_value: "Platform", label: "Platform", sort_order: 20, active: true },
  { id: "vsi-pc-service", value_set_id: "vs-product-category", api_value: "Service", label: "Service", sort_order: 30, active: true },
  { id: "vsi-pc-knowledge", value_set_id: "vs-product-category", api_value: "Knowledge", label: "Knowledge", sort_order: 40, active: true },
];

async function main() {
  console.log("Seeding mission_control (install-only) at", url.replace(/:[^:@/]+@/, ":***@"));

  // Primary Org — insert only; never modify an existing org on re-run.
  await sql`
    INSERT INTO organizations (id, name, data)
    VALUES (${ORG.id}, ${ORG.name}, ${sql.json(ORG.data)})
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("primary org ok (insert-if-missing)");

  // First admin — insert only; never reset an existing account on re-run.
  const hash = bcrypt.hashSync(ADMIN.password, 10);
  await sql`
    INSERT INTO users (id, email, name, role, type, status, password_hash, data)
    VALUES (${ADMIN.id}, ${ADMIN.email}, ${ADMIN.name}, ${ADMIN.role}, ${ADMIN.type}, ${ADMIN.status}, ${hash}, ${sql.json(ADMIN.data)})
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("first admin ok (insert-if-missing)");

  // Value sets — catalog upsert by stable id.
  for (const vs of VALUE_SETS) {
    await sql`
      INSERT INTO value_set (id, api_name, label, description)
      VALUES (${vs.id}, ${vs.api_name}, ${vs.label}, ${vs.description})
      ON CONFLICT (id) DO UPDATE SET api_name = EXCLUDED.api_name, label = EXCLUDED.label, description = EXCLUDED.description
    `;
  }
  console.log("value_sets", VALUE_SETS.length);

  // Value set items — catalog upsert by stable id.
  for (const vsi of VALUE_SET_ITEMS) {
    await sql`
      INSERT INTO value_set_item (id, value_set_id, api_value, label, sort_order, active)
      VALUES (${vsi.id}, ${vsi.value_set_id}, ${vsi.api_value}, ${vsi.label}, ${vsi.sort_order}, ${vsi.active})
      ON CONFLICT (id) DO UPDATE SET value_set_id = EXCLUDED.value_set_id, api_value = EXCLUDED.api_value, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, active = EXCLUDED.active
    `;
  }
  console.log("value_set_items", VALUE_SET_ITEMS.length);

  // Summary — live business tables stay empty on a fresh install by design.
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM organizations) as orgs,
      (SELECT count(*) FROM users) as users,
      (SELECT count(*) FROM value_set) as value_sets,
      (SELECT count(*) FROM value_set_item) as value_set_items,
      (SELECT count(*) FROM projects) as projects,
      (SELECT count(*) FROM tasks) as tasks,
      (SELECT count(*) FROM products) as products,
      (SELECT count(*) FROM integrations) as integrations
  `;
  console.table(counts);
  console.log("DONE (install-only: projects/tasks/products/integrations intentionally empty; demo content = Settings → Modes → Insert Sample Data)");
  await sql.end();
}

main().catch(async (err) => { console.error(err); try { await sql.end(); } catch {} process.exit(1); });
