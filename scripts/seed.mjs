#!/usr/bin/env node
/**
 * Phase 2+ seed — org, departments, users, catalog, projects, tasks, products, integrations.
 * Idempotent upserts by primary key. Fixtures remain source of truth.
 * Usage: DATABASE_URL=... node scripts/seed.mjs
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "postgresql://mission:mission@localhost:5432/mission_control";
const sql = postgres(url, { max: 1 });

// --- Org + Departments + Users (Phase 2) ---
const ORG = { id: "org-1", name: "Sample Maker Workspace", data: { tagline: "Mission Control demo org", slogan: "Run your business from one place.", logoUrl: "/brand/logo.svg", description: "Mission Control brings your projects, operations, customer support, integrations, and knowledge into a single dashboard.", purpose: "Give teams a single pane of glass to plan work, serve customers, and keep the business running smoothly.", production: "Projects, tasks, support tickets, metrics, integrations, and a searchable knowledge base.", contactEmail: "hello@example.com", contactPhone: "+1 (555) 010-1000", address: "100 Market Street, Suite 400, Austin, TX", website: "https://example.com" } };

const DEPARTMENTS = [
  { id: "dept-leadership", code: "leadership", name: "Leadership" },
  { id: "dept-operations", code: "operations", name: "Operations" },
  { id: "dept-research", code: "research", name: "Research" },
  { id: "dept-customer", code: "customer", name: "Customer" },
  { id: "dept-outreach", code: "outreach", name: "Outreach" },
];

const USERS = [
  { id: "user-1", email: "admin@example.com", name: "Alex Morgan", role: "admin", type: "human", status: "active", departmentId: "dept-leadership", password: "mission2026", data: { job_title: "Founder", department: "Leadership", bio: "Founder and producer for the sample maker workspace." } },
  { id: "user-2", email: "ops-assistant@example.com", name: "Ops Assistant", role: "admin", type: "agent", status: "active", departmentId: "dept-operations", password: "mission2026", data: { job_title: "Sample agent", department: "Operations", bio: "Sample agent account with admin role for demos.", role: "Operations coordinator", model: "sample-model", lastActive: "2026-07-14T22:30:00Z" } },
  { id: "user-3", email: "member@example.com", name: "Jordan Lee", role: "member", type: "human", status: "active", departmentId: "dept-operations", password: "mission2026", data: { job_title: "Operations lead", department: "Operations", bio: "Operations lead keeping production on cadence." } },
  { id: "user-4", email: "research@example.com", name: "Research Assistant", role: "member", type: "agent", status: "active", departmentId: "dept-research", password: "mission2026", data: { job_title: "Sample agent", department: "Research", bio: "Sample agent account with member role.", role: "Research support", model: "sample-model", lastActive: "2026-07-14T21:15:00Z" } },
  { id: "user-5", email: "success@example.com", name: "Casey Nguyen", role: "member", type: "human", status: "active", departmentId: "dept-customer", password: "mission2026", data: { job_title: "Customer partner", department: "Customer", bio: "Customer partner helping buyers adopt what we ship." } },
  { id: "user-6", email: "marketing@example.com", name: "Riley Brooks", role: "member", type: "human", status: "active", departmentId: "dept-outreach", password: "mission2026", data: { job_title: "Marketing", department: "Outreach", bio: "Marketing voice for the sample workspace." } },
];

// --- Catalog (value sets + items + field definitions + layouts) ---
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

// --- Projects ---
const PROJECTS = [
  { id: "proj-1", name: "Public story refresh", description: "Update the public site so it speaks to makers and producers, not a consulting brochure.", status: "active", ownerUserId: "user-6", priority: "high", startDate: "2026-07-01", targetDate: "2026-08-15", data: {} },
  { id: "proj-2", name: "First-customer onboarding", description: "Standardize how new buyers are welcomed, trained, and handed to ongoing care.", status: "active", ownerUserId: "user-5", priority: "normal", startDate: "2026-06-15", targetDate: "2026-09-01", data: {} },
  { id: "proj-3", name: "Q3 production review", description: "Quarterly review of capacity, quality, and what to make next.", status: "paused", ownerUserId: "user-3", priority: "normal", startDate: "2026-07-01", targetDate: "2026-07-31", data: {} },
  { id: "proj-4", name: "Craft handbook v2", description: "Rewrite how-we-make guides so quality is teachable and repeatable.", status: "active", ownerUserId: "user-1", priority: "low", startDate: "2026-06-01", targetDate: "2026-10-01", data: {} },
  { id: "proj-5", name: "Legacy catalog migration", description: "Move product and customer records from the old shop tools into the new workspace.", status: "completed", ownerUserId: "user-3", priority: "high", startDate: "2026-05-01", targetDate: "2026-06-30", data: {} },
];

// --- Tasks ---
const TASKS = [
  { id: "task-1", title: "Draft homepage copy for makers", description: "Write hero, purpose, and production narrative that resonates with founders and producers.", status: "in_progress", priority: "high", projectId: "proj-1", assigneeUserId: "user-6", dueDate: "2026-07-18", data: {} },
  { id: "task-2", title: "Photograph finished product set", description: "Capture clean product photos for the public catalog and first offer page.", status: "planned", priority: "normal", projectId: "proj-1", assigneeUserId: "user-1", dueDate: "2026-07-25", data: {} },
  { id: "task-3", title: "Write welcome sequence for new buyers", description: "Three-message sequence: thank you, how to use, how to get help.", status: "waiting", priority: "normal", projectId: "proj-2", assigneeUserId: "user-5", dueDate: "2026-07-20", data: {} },
  { id: "task-4", title: "Publish remote-work craft policy", description: "Update the handbook section on remote production and hybrid collaboration.", status: "in_progress", priority: "normal", projectId: "proj-4", assigneeUserId: "user-1", dueDate: "2026-07-22", data: {} },
  { id: "task-5", title: "Review capacity for next release", description: "Check open orders, agent load, and human hours before committing the next ship date.", status: "planned", priority: "high", projectId: "proj-3", assigneeUserId: "user-3", dueDate: "2026-07-28", data: {} },
];

// --- Products ---
const PRODUCTS = [
  { id: "prod-1", name: "Maker Starter Kit", tagline: "Templates to go from idea to first sale.", description: "A packaged set of checklists and templates for product specs, first offers, fulfillment, and customer follow-up.", category: "Packages", status: "available", data: { features: ["Product brief template", "Offer and pricing sheet", "Fulfillment checklist", "First-customer follow-up"] } },
  { id: "prod-2", name: "Production Workspace", tagline: "One place for projects, tasks, and the people who ship them.", description: "A simple workspace for projects, tasks, and team directories so makers and operators know what is in progress and who owns it.", category: "Platform", status: "beta", data: { features: ["Projects and tasks", "Role-based access", "Team directory (people + agents)", "Activity overview"] } },
  { id: "prod-3", name: "Customer Care Desk", tagline: "Support that stays organized while you keep making.", description: "A lightweight desk for intake, prioritization, and resolution of customer requests with clear ownership and history.", category: "Service", status: "available", data: { features: ["Request intake", "Priority queues", "Response templates", "Satisfaction check-ins"] } },
  { id: "prod-4", name: "Craft Handbook", tagline: "How we make things — always current.", description: "A living handbook for recipes, policies, and how-we-work guides that new collaborators and veterans can trust.", category: "Knowledge", status: "available", data: { features: ["Process library", "Quality standards", "Search", "Version history"] } },
];

// --- Integrations ---
const INTEGRATIONS = [
  { id: "int-1", productId: "prod-2", name: "Company email", type: "email", status: "connected", lastSync: "2026-07-14T23:00:00Z", description: "Shared inbox for client and support mail" },
  { id: "int-2", productId: "prod-4", name: "Knowledge CMS", type: "cms", status: "connected", lastSync: "2026-07-14T22:45:00Z", description: "Handbook and process documentation" },
  { id: "int-3", productId: "prod-2", name: "Team chat", type: "messaging", status: "connected", lastSync: "2026-07-14T23:30:00Z", description: "Internal messaging for delivery teams" },
  { id: "int-4", productId: null, name: "Source control", type: "api", status: "disconnected", lastSync: "2026-07-13T10:00:00Z", description: "Code and configuration repositories" },
  { id: "int-5", productId: null, name: "Analytics warehouse", type: "database", status: "error", lastSync: "2026-07-14T20:15:00Z", description: "Reporting database for operational metrics" },
];

async function main() {
  console.log("Seeding mission_control at", url.replace(/:[^:@/]+@/, ":***@"));

  // Org
  await sql`
    INSERT INTO organizations (id, name, data)
    VALUES (${ORG.id}, ${ORG.name}, ${sql.json(ORG.data)})
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data, updated_at = now()
  `;
  console.log("org ok");

  // Departments
  for (const d of DEPARTMENTS) {
    await sql`
      INSERT INTO departments (id, organization_id, code, name, data)
      VALUES (${d.id}, ${ORG.id}, ${d.code}, ${d.name}, ${sql.json({})})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, updated_at = now()
    `;
  }
  console.log("departments", DEPARTMENTS.length);

  // Users
  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    await sql`
      INSERT INTO users (id, email, name, role, type, status, department_id, password_hash, data)
      VALUES (${u.id}, ${u.email}, ${u.name}, ${u.role}, ${u.type}, ${u.status}, ${u.departmentId}, ${hash}, ${sql.json(u.data)})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
        type = EXCLUDED.type, status = EXCLUDED.status, department_id = EXCLUDED.department_id,
        password_hash = EXCLUDED.password_hash, data = EXCLUDED.data, updated_at = now()
    `;
  }
  console.log("users", USERS.length);

  // Value sets
  for (const vs of VALUE_SETS) {
    await sql`
      INSERT INTO value_set (id, api_name, label, description)
      VALUES (${vs.id}, ${vs.api_name}, ${vs.label}, ${vs.description})
      ON CONFLICT (id) DO UPDATE SET api_name = EXCLUDED.api_name, label = EXCLUDED.label, description = EXCLUDED.description
    `;
  }
  console.log("value_sets", VALUE_SETS.length);

  // Value set items
  for (const vsi of VALUE_SET_ITEMS) {
    await sql`
      INSERT INTO value_set_item (id, value_set_id, api_value, label, sort_order, active)
      VALUES (${vsi.id}, ${vsi.value_set_id}, ${vsi.api_value}, ${vsi.label}, ${vsi.sort_order}, ${vsi.active})
      ON CONFLICT (id) DO UPDATE SET value_set_id = EXCLUDED.value_set_id, api_value = EXCLUDED.api_value, label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, active = EXCLUDED.active
    `;
  }
  console.log("value_set_items", VALUE_SET_ITEMS.length);

  // Projects
  for (const p of PROJECTS) {
    await sql`
      INSERT INTO projects (id, organization_id, name, description, status, owner_user_id, priority, start_date, target_date, data)
      VALUES (${p.id}, ${ORG.id}, ${p.name}, ${p.description}, ${p.status}, ${p.ownerUserId}, ${p.priority}, ${p.startDate}, ${p.targetDate}, ${sql.json(p.data)})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status,
        owner_user_id = EXCLUDED.owner_user_id, priority = EXCLUDED.priority,
        start_date = EXCLUDED.start_date, target_date = EXCLUDED.target_date, data = EXCLUDED.data, updated_at = now()
    `;
  }
  console.log("projects", PROJECTS.length);

  // Tasks
  for (const t of TASKS) {
    await sql`
      INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_user_id, due_date, data)
      VALUES (${t.id}, ${t.projectId}, ${t.title}, ${t.description}, ${t.status}, ${t.priority}, ${t.assigneeUserId}, ${t.dueDate}, ${sql.json(t.data)})
      ON CONFLICT (id) DO UPDATE SET
        project_id = EXCLUDED.project_id, title = EXCLUDED.title, description = EXCLUDED.description,
        status = EXCLUDED.status, priority = EXCLUDED.priority, assignee_user_id = EXCLUDED.assignee_user_id,
        due_date = EXCLUDED.due_date, data = EXCLUDED.data, updated_at = now()
    `;
  }
  console.log("tasks", TASKS.length);

  // Products
  for (const p of PRODUCTS) {
    await sql`
      INSERT INTO products (id, organization_id, name, tagline, description, category, status, data)
      VALUES (${p.id}, ${ORG.id}, ${p.name}, ${p.tagline}, ${p.description}, ${p.category}, ${p.status}, ${sql.json(p.data)})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, tagline = EXCLUDED.tagline, description = EXCLUDED.description,
        category = EXCLUDED.category, status = EXCLUDED.status, data = EXCLUDED.data, updated_at = now()
    `;
  }
  console.log("products", PRODUCTS.length);

  // Integrations
  for (const i of INTEGRATIONS) {
    await sql`
      INSERT INTO integrations (id, product_id, name, type, status, last_sync, description, data)
      VALUES (${i.id}, ${i.productId}, ${i.name}, ${i.type}, ${i.status}, ${i.lastSync}, ${i.description}, ${sql.json({})})
      ON CONFLICT (id) DO UPDATE SET
        product_id = EXCLUDED.product_id, name = EXCLUDED.name, type = EXCLUDED.type,
        status = EXCLUDED.status, last_sync = EXCLUDED.last_sync, description = EXCLUDED.description, updated_at = now()
    `;
  }
  console.log("integrations", INTEGRATIONS.length);

  // Summary
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM organizations) as orgs,
      (SELECT count(*) FROM departments) as depts,
      (SELECT count(*) FROM users) as users,
      (SELECT count(*) FROM value_set) as value_sets,
      (SELECT count(*) FROM value_set_item) as value_set_items,
      (SELECT count(*) FROM projects) as projects,
      (SELECT count(*) FROM tasks) as tasks,
      (SELECT count(*) FROM products) as products,
      (SELECT count(*) FROM integrations) as integrations
  `;
  console.table(counts);
  await sql.end();
  console.log("DONE");
}

main().catch(async (err) => { console.error(err); try { await sql.end(); } catch {} process.exit(1); });
