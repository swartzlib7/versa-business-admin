#!/usr/bin/env node
/**
 * migrate_agi_org — map host Versa AGi Organization → Versa - Business Admin.
 *
 * Default is a dry-run against this host's Organization module. Does not copy
 * credential secrets. Does not disable the host Organization feature.
 *
 *   node scripts/migrate_agi_org.mjs
 *   node scripts/migrate_agi_org.mjs --apply --base http://localhost:3200
 *
 * Fixture-mode VBA keeps applied orgs in memory until process restart.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : "http://localhost:3200";
})();

if (args.has("--disable-host-org")) {
  console.error(
    "Refusing --disable-host-org. This host's Organization module is live (Wave sync, invoices). Disable it only on a planned production cutover, after VBA is the system of record.",
  );
  process.exit(2);
}

function agictlJson(argv) {
  const raw = execFileSync("agictl", argv, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(raw);
}

function listAll(entity) {
  const page = agictlJson(["organization", entity, "list", "--limit", "2000"]);
  return { count: page.count ?? (page.rows || []).length, rows: page.rows || [] };
}

/** Own Wave businesses on this host — VBA branches under the Primary Org. */
const OWN_EXTERNAL = new Set(["wave-c3d-studio", "wave-duende", "wave-personal"]);
const OWN_IDS = new Set([8, 42, 47]);
const WAVE_VENDOR_ID = 41;

function mapHostOrg(row) {
  const external_id = row.external_id || `agi-org:${row.id}`;
  const data = {
    agi_org_id: row.id,
    external_id,
    agi_type: row.type,
    agi_slug: row.slug,
    notes: row.notes || undefined,
    migrated_from: "agi_org",
  };
  if (row.id === WAVE_VENDOR_ID || row.type === "accounting") {
    return {
      name: row.name,
      org_type: "vendor",
      is_person: false,
      parent_organization_id: null,
      data: { ...data, integration_kind: "wave_accounting" },
      role: "integration_vendor",
    };
  }
  if (OWN_IDS.has(row.id) || OWN_EXTERNAL.has(row.external_id) || OWN_EXTERNAL.has(row.slug)) {
    return {
      name: row.name,
      org_type: "branch",
      is_person: false,
      parent_organization_id: "PRIMARY",
      data,
      role: "own_business",
    };
  }
  if (row.type === "vendor") {
    return {
      name: row.name,
      org_type: "vendor",
      is_person: false,
      parent_organization_id: null,
      data,
      role: "vendor",
    };
  }
  return {
    name: row.name,
    org_type: "customer",
    is_person: false,
    parent_organization_id: null,
    data,
    role: String(row.external_id || "").startsWith("wave-cust") ? "wave_customer" : "customer",
  };
}

function credentialSummary(rows) {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    auth_type: r.auth_type,
    notes: r.notes || null,
    // Never copy configuration / secrets.
  }));
}

function uniqueExchangeNames(rows) {
  const names = new Map();
  for (const r of rows) {
    const n = r.name || "(unnamed)";
    names.set(n, (names.get(n) || 0) + 1);
  }
  return [...names.entries()].map(([name, count]) => ({ name, count }));
}

async function loginAdmin(base) {
  const ch = await (await fetch(`${base}/api/auth/challenge`)).json();
  const c = ch.data;
  let solution = 0;
  while (
    !crypto
      .createHash("sha256")
      .update(`${c.nonce}:${solution}`)
      .digest("hex")
      .startsWith("0".repeat(c.difficulty))
  ) {
    solution += 1;
  }
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@example.com",
      password: "mission2026",
      challenge: { nonce: c.nonce, issued: c.issued, difficulty: c.difficulty, sig: c.sig, solution },
    }),
  });
  if (!login.ok) {
    throw new Error(`VBA login failed: ${login.status}`);
  }
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  return { Cookie: cookie };
}

async function applyOrgs(base, planned) {
  const headers = await loginAdmin(base);
  const existing = await (await fetch(`${base}/api/organizations`, { headers })).json();
  const rows = existing.data || [];
  const primary = rows.find((o) => o.is_primary || o.org_type === "internal");
  if (!primary) throw new Error("VBA has no Primary Org");
  const byExt = new Map();
  for (const o of rows) {
    const ext = o.data?.external_id || o.data?.agi_org_id;
    if (ext != null) byExt.set(String(ext), o);
  }
  const created = [];
  const skipped = [];
  for (const item of planned) {
    const ext = String(item.data.external_id);
    const agi = String(item.data.agi_org_id);
    if (byExt.has(ext) || byExt.has(agi)) {
      skipped.push({ name: item.name, reason: "already present" });
      continue;
    }
    const body = {
      name: item.name,
      is_person: item.is_person,
      org_type: item.org_type,
      parent_organization_id:
        item.parent_organization_id === "PRIMARY" ? primary.id : item.parent_organization_id,
      data: item.data,
    };
    const res = await fetch(`${base}/api/organizations`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      skipped.push({ name: item.name, reason: json.error?.message || `HTTP ${res.status}` });
      continue;
    }
    created.push({ id: json.data?.id, name: item.name, org_type: item.org_type, role: item.role });
  }
  return { primary: { id: primary.id, name: primary.name }, created, skipped };
}

const orgs = listAll("org");
const products = listAll("product");
const invoices = listAll("invoice");
const estimates = listAll("estimate");
const transactions = listAll("transaction");
const exchange = listAll("exchange");
const credentials = listAll("credential");

const planned = orgs.rows.map(mapHostOrg);
const byRole = {};
for (const p of planned) {
  byRole[p.role] = (byRole[p.role] || 0) + 1;
}
const byType = {};
for (const p of planned) {
  byType[p.org_type] = (byType[p.org_type] || 0) + 1;
}

const report = {
  mode: APPLY ? "apply" : "dry-run",
  host: {
    organizations: orgs.count,
    products: products.count,
    invoices: invoices.count,
    estimates: estimates.count,
    transactions: transactions.count,
    exchange_rows: exchange.count,
    credentials: credentials.count,
  },
  mapping: {
    by_role: byRole,
    by_org_type: byType,
    sample: planned.slice(0, 8).map((p) => ({
      name: p.name,
      org_type: p.org_type,
      role: p.role,
      external_id: p.data.external_id,
    })),
  },
  skipped_this_pass: {
    productions: {
      reason: "VBA Production zone is not the migrate target this pass. Host products exist but are not written.",
      host_product_count: products.count,
    },
    treasury: {
      reason: "treasury_transaction / invoice / estimate kinds are not written this pass.",
      invoices: invoices.count,
      estimates: estimates.count,
      transactions: transactions.count,
    },
    secrets: {
      reason: "Credential configuration is not copied. Names/types only.",
    },
  },
  integrations_to_turn_off_on_cutover: [
    {
      name: "Wave Accounting",
      host: "Organization module + daily Wave sync (script task into host org store)",
      port_to_vba: "New vendor org (Wave Accounting) + vendor_integration instance. Wave MCP stays; target becomes VBA, not host org.db.",
      do_not_disable_on_this_dev_host: true,
    },
    {
      name: "IMAP mailboxes stored as Organization credentials",
      host: "Email access credentials hanging off Organization",
      port_to_vba: "Optional later as vendor_credential. This pass does not copy them. Host email feature can keep them.",
      accounts: credentialSummary(credentials.rows).map((c) => ({
        name: c.name,
        auth_type: c.auth_type,
      })),
    },
  ],
  exchange_integrations: uniqueExchangeNames(exchange.rows),
  apply: null,
};

if (APPLY) {
  report.apply = await applyOrgs(BASE, planned);
}

console.log(JSON.stringify(report, null, 2));
