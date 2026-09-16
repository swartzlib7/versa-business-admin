#!/usr/bin/env node
/**
 * migrate_agi_org — map host Versa AGi Organization → Versa - Business Admin.
 *
 * Reads host Organization through `agictl organization` (not a shared DB).
 * Default is a dry-run. `--apply` writes into VBA over HTTP.
 *
 *   node scripts/migrate_agi_org.mjs
 *   node scripts/migrate_agi_org.mjs --primary-source-org-id 8
 *   node scripts/migrate_agi_org.mjs --apply --primary-source-org-id 8 --base http://localhost:3200
 *
 * `--primary-source-org-id` is required to apply (id, slug, external_id, or name).
 * Auth credentials (IMAP/API configuration) are copied onto vendor_credential.
 * Never prints configuration. `--disable-host-org` is refused unless the Primary User has asked.
 * Fixture-mode VBA keeps applied rows in memory until restart.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const BASE = (() => {
  const i = process.argv.indexOf("--base");
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : "http://localhost:3200";
})();
const PRIMARY_SPEC = (() => {
  const flags = ["--primary-source-org-id", "--primary-source-org"];
  for (const f of flags) {
    const i = process.argv.indexOf(f);
    if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  }
  return null;
})();

if (args.has("--disable-host-org")) {
  console.error(
    "Refusing --disable-host-org. Do not disable agitop Organization unless the Primary User has asked, after VBA is the system of record on a verified migrate.",
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

function takeCredentialSecrets(rows) {
  const secrets = new Map();
  for (const r of rows) {
    if (r.configuration != null) secrets.set(r.id, r.configuration);
    delete r.configuration;
  }
  return secrets;
}

function configToString(value) {
  if (value == null || value === "") return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
}

const OWN_EXTERNAL = new Set(["wave-c3d-studio", "wave-duende", "wave-personal"]);
const OWN_IDS = new Set([8, 42, 47]);
const WAVE_VENDOR_ID = 41;

function ext(prefix, row) {
  return row.external_id || `${prefix}:${row.id}`;
}

function centsToDecimal(cents) {
  if (cents == null || cents === "") return undefined;
  const n = Number(cents);
  if (!Number.isFinite(n)) return undefined;
  return (n / 100).toFixed(2);
}

function str(v) {
  if (v == null || v === "") return undefined;
  return String(v);
}

function boolStr(v) {
  if (v == null) return undefined;
  return v === true || v === 1 || v === "1" || v === "true" ? "true" : "false";
}

function compact(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

function resolvePrimarySource(rows, spec) {
  if (!spec) return null;
  const s = String(spec);
  return (
    rows.find(
      (o) =>
        String(o.id) === s ||
        o.slug === s ||
        o.external_id === s ||
        String(o.name).toLowerCase() === s.toLowerCase(),
    ) || null
  );
}

function mapHostOrg(row, primarySource) {
  const external_id = ext("agi-org", row);
  const data = compact({
    agi_org_id: row.id,
    external_id,
    agi_type: row.type,
    agi_slug: row.slug,
    slug: row.slug,
    notes: row.notes,
    logo_url: row.logo_path,
    is_active: row.is_active === 0 || row.is_active === false ? false : true,
    migrated_from: "agi_org",
  });
  if (primarySource && Number(row.id) === Number(primarySource.id)) {
    return {
      name: row.name,
      org_type: "internal",
      is_person: false,
      parent_organization_id: null,
      data,
      role: "primary_source",
      merge_into_primary: true,
    };
  }
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
      org_type: "internal",
      is_person: false,
      parent_organization_id: null,
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

function connectionNames() {
  const map = new Map();
  for (const argv of [
    ["connection", "list", "primary-user"],
    ["connection", "list", "agent"],
  ]) {
    try {
      const raw = agictlJson(argv);
      const rows = Array.isArray(raw) ? raw : raw.rows || raw.connections || raw.data || [];
      for (const r of rows) {
        if (r?.uid && r?.name) map.set(String(r.uid), String(r.name));
      }
    } catch {
      /* VersaVoice lookup is best-effort */
    }
  }
  return map;
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
  return { Cookie: cookie, "Content-Type": "application/json" };
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status} ${json.error?.message || ""}`);
  return json;
}

function indexByExt(rows) {
  const map = new Map();
  for (const o of rows) {
    const data = o.data || {};
    for (const key of [data.external_id, data.agi_org_id, o.external_id]) {
      if (key != null && key !== "") map.set(String(key), o);
    }
  }
  return map;
}

function findPrimaryOrg(rows) {
  return (
    rows.find((o) => o.is_primary || o.data?.is_primary === true) ??
    rows.find((o) => o.org_type === "internal")
  );
}

async function applyOrgs(base, headers, planned) {
  const existing = await getJson(`${base}/api/organizations`, headers);
  const rows = existing.data || [];
  const primary = findPrimaryOrg(rows);
  if (!primary) throw new Error("VBA has no Primary Org");
  const byExt = indexByExt(rows);
  const created = [];
  const skipped = [];
  const merged = [];
  const updated = [];
  for (const item of planned) {
    const extId = String(item.data.external_id);
    const agi = String(item.data.agi_org_id);
    if (item.merge_into_primary) {
      const res = await fetch(`${base}/api/organizations/${primary.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: item.name,
          data: item.data,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        skipped.push({ name: item.name, reason: json.error?.message || `HTTP ${res.status}` });
        continue;
      }
      const mergedRow = json.data || primary;
      byExt.set(extId, mergedRow);
      byExt.set(agi, mergedRow);
      merged.push({ id: mergedRow.id, name: item.name, org_type: "internal", role: "primary_source" });
      continue;
    }
    const existingOrg = byExt.get(extId) || byExt.get(agi);
    const wantParent =
      item.parent_organization_id === "PRIMARY" ? primary.id : item.parent_organization_id ?? null;
    if (existingOrg) {
      const haveParent = existingOrg.parent_organization_id ?? null;
      if (
        existingOrg.org_type !== item.org_type ||
        haveParent !== wantParent ||
        existingOrg.name !== item.name
      ) {
        const res = await fetch(`${base}/api/organizations/${existingOrg.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: item.name,
            org_type: item.org_type,
            parent_organization_id: wantParent,
            data: item.data,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          skipped.push({ name: item.name, reason: json.error?.message || `HTTP ${res.status}` });
          continue;
        }
        const row = json.data || existingOrg;
        byExt.set(extId, row);
        byExt.set(agi, row);
        updated.push({ id: row.id, name: item.name, org_type: item.org_type, role: item.role });
      } else {
        skipped.push({ name: item.name, reason: "already present" });
      }
      continue;
    }
    const body = {
      name: item.name,
      is_person: item.is_person,
      org_type: item.org_type,
      parent_organization_id: wantParent,
      data: item.data,
    };
    const res = await fetch(`${base}/api/organizations`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      skipped.push({ name: item.name, reason: json.error?.message || `HTTP ${res.status}` });
      continue;
    }
    created.push({ id: json.data?.id, name: item.name, org_type: item.org_type, role: item.role });
    if (json.data) {
      byExt.set(extId, json.data);
      byExt.set(agi, json.data);
    }
  }
  const refreshed = await getJson(`${base}/api/organizations`, headers);
  return {
    primary: { id: primary.id, name: primary.name },
    created,
    skipped,
    merged,
    updated,
    byExt: indexByExt(refreshed.data || []),
    all: refreshed.data || [],
  };
}

function orgUuid(byExt, agiId) {
  if (agiId == null) return undefined;
  return byExt.get(String(agiId))?.id;
}

async function listRecords(base, headers, type) {
  const json = await getJson(`${base}/api/records?type=${encodeURIComponent(type)}`, headers);
  return json.data || [];
}

async function upsertRecord(base, headers, existingByExt, payload, opts = {}) {
  const extId = payload.data?.external_id;
  if (extId && existingByExt.has(String(extId))) {
    const rec = existingByExt.get(String(extId));
    if (opts.updateIfPresent && rec?.id) {
      const patched = await patchRecord(base, headers, rec.id, payload.data);
      if (!patched.ok) {
        return { action: "error", name: payload.name, reason: patched.reason };
      }
      return { action: "updated", id: rec.id, name: payload.name };
    }
    return { action: "skipped", reason: "already present", name: payload.name };
  }
  const res = await fetch(`${base}/api/records`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      action: "error",
      name: payload.name,
      reason: json.error?.message || `HTTP ${res.status}`,
    };
  }
  const rec = json.data;
  if (rec && extId) existingByExt.set(String(extId), rec);
  return { action: "created", id: rec?.id, name: payload.name };
}

async function patchRecord(base, headers, id, data) {
  const res = await fetch(`${base}/api/records/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ data }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: json.error?.message || `HTTP ${res.status}` };
  return { ok: true };
}

function summarize(results) {
  const out = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const r of results) {
    if (r.action === "created") out.created += 1;
    else if (r.action === "updated") out.updated += 1;
    else if (r.action === "skipped") out.skipped += 1;
    else if (r.action === "error") out.errors.push({ name: r.name, reason: r.reason });
  }
  return out;
}

function isSampleExt(value) {
  return typeof value === "string" && value.startsWith("ba_sample:");
}

function isMigratedExt(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("agi-") || value.startsWith("wave-") || value.startsWith("agi_org"))
  );
}

async function inspectTarget(base, headers) {
  const orgs = (await getJson(`${base}/api/organizations`, headers)).data || [];
  const primary = findPrimaryOrg(orgs);
  const extraOrgs = orgs.filter((o) => o.id !== primary?.id);
  const recs = (await getJson(`${base}/api/records`, headers)).data || [];
  const sampleRecords = recs.filter((r) => isSampleExt(r.data?.external_id));
  const migratedRecords = recs.filter((r) => isMigratedExt(r.data?.external_id));
  const independentRecords = recs.filter((r) => {
    const e = r.data?.external_id;
    if (e == null || e === "") return true;
    return !isSampleExt(e) && !isMigratedExt(e);
  });
  const independentOrgs = extraOrgs.filter((o) => {
    const e = o.data?.external_id;
    if (e == null || e === "") return o.data?.migrated_from !== "agi_org";
    return !isSampleExt(e) && !isMigratedExt(e);
  });
  const priorMigrate =
    extraOrgs.some((o) => o.data?.migrated_from === "agi_org") || migratedRecords.length > 0;
  const mergeRecommended = independentOrgs.length > 0 || independentRecords.length > 0;
  let agentTeam;
  if (mergeRecommended) {
    agentTeam =
      "Both systems look like they already have production data. Do not treat apply as a blank-slate load. Plan a merge pass: match parties by external_id, then reconcile VBA-only rows that have no Wave/AGi id. Idempotent re-apply will skip ids that already migrated.";
  } else if (priorMigrate) {
    agentTeam =
      "Target already has a prior AGi migrate. Re-apply is idempotent on external_id. Confirm the Primary Org mapping, then fill any rows that were skipped (e.g. credential configuration).";
  } else if (sampleRecords.length > 0) {
    agentTeam =
      "Target has sample data (ba_sample:). Delete Sample Data before a production cutover unless you intend to keep those rows next to live parties.";
  } else {
    agentTeam =
      "Target looks like a clean install for this migrate. No merge pass expected unless operators add VBA-only records after apply.";
  }
  return {
    primary: primary ? { id: primary.id, name: primary.name } : null,
    extra_organization_count: extraOrgs.length,
    record_count: recs.length,
    sample_record_count: sampleRecords.length,
    migrated_record_count: migratedRecords.length,
    independent_production_orgs: independentOrgs.map((o) => o.name),
    independent_production_record_count: independentRecords.length,
    prior_migrate: priorMigrate,
    merge_recommended: mergeRecommended,
    agent_team: agentTeam,
  };
}

const orgs = listAll("org");
const products = listAll("product");
const invoices = listAll("invoice");
const invoiceItems = listAll("invoice-item");
const estimates = listAll("estimate");
const estimateItems = listAll("estimate-item");
const transactions = listAll("transaction");
const exchange = listAll("exchange");
const credentials = listAll("credential");
const credentialSecrets = takeCredentialSecrets(credentials.rows);
const addresses = listAll("address");
const emails = listAll("email");
const orgAddresses = listAll("org-address");
const orgEmails = listAll("org-email");
const orgStaff = listAll("org-staff");

const sourceOrgs = orgs.rows.map((o) => ({
  id: o.id,
  name: o.name,
  type: o.type,
  slug: o.slug || null,
  external_id: o.external_id || null,
}));
const primarySource = resolvePrimarySource(orgs.rows, PRIMARY_SPEC);
if (APPLY && !primarySource) {
  console.error(
    JSON.stringify(
      {
        error: "PRIMARY_SOURCE_ORG_REQUIRED",
        message:
          "Pass --primary-source-org-id <id|slug|external_id|name> from the source Organization list. Apply refuses to guess which source org is Primary.",
        source_organizations: sourceOrgs,
        example: "node scripts/migrate_agi_org.mjs --apply --primary-source-org-id 8 --base http://localhost:3200",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

const plannedOrgs = primarySource ? orgs.rows.map((row) => mapHostOrg(row, primarySource)) : [];
const byRole = {};
for (const p of plannedOrgs) byRole[p.role] = (byRole[p.role] || 0) + 1;
const byType = {};
for (const p of plannedOrgs) byType[p.org_type] = (byType[p.org_type] || 0) + 1;

const itemsByInvoice = new Map();
for (const line of invoiceItems.rows) {
  const k = String(line.invoice_id);
  if (!itemsByInvoice.has(k)) itemsByInvoice.set(k, []);
  itemsByInvoice.get(k).push(line);
}
const itemsByEstimate = new Map();
for (const line of estimateItems.rows) {
  const k = String(line.estimate_id);
  if (!itemsByEstimate.has(k)) itemsByEstimate.set(k, []);
  itemsByEstimate.get(k).push(line);
}
const addrById = new Map(addresses.rows.map((r) => [r.id, r]));
const emailById = new Map(emails.rows.map((r) => [r.id, r]));
const orgIdsForAddress = new Map();
for (const b of orgAddresses.rows) {
  const list = orgIdsForAddress.get(b.address_id) || [];
  list.push(b.org_id);
  orgIdsForAddress.set(b.address_id, list);
}
const orgIdsForEmail = new Map();
for (const b of orgEmails.rows) {
  const list = orgIdsForEmail.get(b.email_id) || [];
  list.push(b.org_id);
  orgIdsForEmail.set(b.email_id, list);
}

const primaryWarning =
  primarySource &&
  (String(primarySource.external_id || "").startsWith("wave-cust") ||
    primarySource.type === "vendor" ||
    primarySource.type === "accounting")
    ? "Selected source org looks like a customer, vendor, or accounting party. Confirm this is the business that should become VBA Primary Org."
    : null;

const report = {
  mode: APPLY ? "apply" : "dry-run",
  primary_source: primarySource
    ? {
        id: primarySource.id,
        name: primarySource.name,
        type: primarySource.type,
        slug: primarySource.slug || null,
        external_id: primarySource.external_id || null,
        warning: primaryWarning,
      }
    : {
        required: true,
        message:
          "Choose the source Organization that is the Primary Org. Apply needs --primary-source-org-id.",
        source_organizations: sourceOrgs,
      },
  post_process: {
    merge_may_be_required:
      "If VBA already has production data (parties or records created outside this migrate), the agent team must merge after apply: match on external_id, then reconcile VBA-only rows. Idempotent re-apply skips ids that already migrated.",
    check: null,
  },
  host: {
    organizations: orgs.count,
    products: products.count,
    invoices: invoices.count,
    invoice_line_items: invoiceItems.count,
    estimates: estimates.count,
    estimate_line_items: estimateItems.count,
    transactions: transactions.count,
    exchange_rows: exchange.count,
    credentials: credentials.count,
    physical_addresses: addresses.count,
    email_addresses: emails.count,
    org_staff: orgStaff.count,
  },
  mapping: {
    by_role: byRole,
    by_org_type: byType,
    planned_records: {
      location: addresses.count,
      contact: emails.count,
      communication_staff: orgStaff.count,
      production_product: products.count,
      treasury_invoice: invoices.count,
      treasury_estimate: estimates.count,
      treasury_transaction: transactions.count,
      vendor_credential: credentials.count,
      vendor_integration: 1,
      vendor_exchange: exchange.count,
    },
  },
  secrets: {
    copied: true,
    printed: false,
    reason:
      "vendor_credential.configuration is copied so the agent team can run after host Organization is off. Configuration is never printed in this report. Stored as catalog long_text until a vault exists; Records Editor shows it to admins.",
    accounts: credentials.rows.map((c) => ({
      id: c.id,
      name: c.name,
      auth_type: c.auth_type,
      configuration_present: credentialSecrets.has(c.id),
    })),
  },
  not_imported: {
    picklists: "AGi picklists seed VBA value sets (document_status, product_kind, auth/exchange). Not rows.",
    host_org_disable: "Refused unless the Primary User has asked. Disable agitop Organization only after VBA is system of record on a verified migrate.",
  },
  apply: null,
};

let headers = null;
try {
  headers = await loginAdmin(BASE);
  report.post_process.check = await inspectTarget(BASE, headers);
} catch (e) {
  report.post_process.check = {
    error: e instanceof Error ? e.message : String(e),
    agent_team: "Could not inspect the VBA target. Agent team should still check for existing production data before apply.",
  };
}

if (APPLY) {
  if (!headers) throw new Error("VBA login failed; cannot apply.");
  const orgResult = await applyOrgs(BASE, headers, plannedOrgs);
  const byExt = orgResult.byExt;
  const names = connectionNames();

  const locByExt = indexByExt(await listRecords(BASE, headers, "location"));
  const contactByExt = indexByExt(await listRecords(BASE, headers, "contact"));
  const staffByExt = indexByExt(await listRecords(BASE, headers, "communication_staff"));
  const productByExt = indexByExt(await listRecords(BASE, headers, "production_product"));
  const txnByExt = indexByExt(await listRecords(BASE, headers, "treasury_transaction"));
  const credByExt = indexByExt(await listRecords(BASE, headers, "vendor_credential"));
  const integByExt = indexByExt(await listRecords(BASE, headers, "vendor_integration"));
  const exchByExt = indexByExt(await listRecords(BASE, headers, "vendor_exchange"));

  const locations = [];
  for (const addr of addresses.rows) {
    const orgId = (orgIdsForAddress.get(addr.id) || [])[0];
    const orgUuidVal = orgUuid(byExt, orgId);
    const combined = [addr.line_1, addr.line_2, addr.city, addr.state, addr.postal_code, addr.country]
      .filter(Boolean)
      .join(", ");
    locations.push(
      await upsertRecord(BASE, headers, locByExt, {
        type_api_name: "location",
        parent_kind: "environment",
        parent_api_name: "locations",
        name: addr.label || combined || `Address ${addr.id}`,
        org_id: orgUuidVal,
        data: compact({
          line_1: addr.line_1,
          line_2: addr.line_2,
          city: addr.city,
          state: addr.state,
          postal_code: addr.postal_code,
          country: addr.country,
          is_primary: boolStr(addr.is_primary),
          address: combined,
          organization_id: orgUuidVal,
          external_id: `agi-addr:${addr.id}`,
        }),
      }),
    );
  }

  const contacts = [];
  for (const em of emails.rows) {
    const orgId = (orgIdsForEmail.get(em.id) || [])[0];
    const orgUuidVal = orgUuid(byExt, orgId);
    const credNote =
      em.credential_id != null ? `Linked credential agi-cred:${em.credential_id}.` : undefined;
    contacts.push(
      await upsertRecord(BASE, headers, contactByExt, {
        type_api_name: "contact",
        parent_kind: "faculty",
        parent_api_name: "public",
        name: em.label || em.email || `Email ${em.id}`,
        org_id: orgUuidVal,
        data: compact({
          contact_kind: orgUuidVal ? "staff" : "public",
          email: em.email,
          email_label: em.label,
          is_primary: boolStr(em.is_primary),
          organization_id: orgUuidVal,
          notes: [em.usage_notes, credNote].filter(Boolean).join("\n") || undefined,
          external_id: `agi-email:${em.id}`,
        }),
      }),
    );
  }

  const staff = [];
  for (const s of orgStaff.rows) {
    const orgUuidVal = orgUuid(byExt, s.org_id);
    const uid = s.connection_uid ? String(s.connection_uid) : "";
    const name = (uid && names.get(uid)) || (uid ? `Staff ${uid.slice(0, 8)}` : `Staff ${s.id}`);
    staff.push(
      await upsertRecord(BASE, headers, staffByExt, {
        type_api_name: "communication_staff",
        parent_kind: "faculty",
        parent_api_name: "communications",
        name,
        org_id: orgUuidVal,
        data: compact({
          role: "other",
          organization_id: orgUuidVal,
          vv_connection_uid: uid || undefined,
          external_id: `agi-staff:${s.id}`,
        }),
      }),
    );
  }

  const productRows = [];
  const agiProductToVba = new Map();
  for (const p of products.rows) {
    const kind = p.type || "product";
    const orgUuidVal = orgUuid(byExt, p.org_id);
    const price = centsToDecimal(p.unit_price_cents);
    const result = await upsertRecord(BASE, headers, productByExt, {
      type_api_name: "production_product",
      parent_kind: "faculty",
      parent_api_name: "production",
      name: p.name,
      org_id: orgUuidVal,
      status: p.is_active === 0 || p.is_active === false ? "inactive" : "active",
      data: compact({
        description: p.description,
        sku: p.sku,
        product_kind: kind,
        currency: p.currency || "USD",
        is_active: boolStr(p.is_active == null ? 1 : p.is_active),
        organization_id: orgUuidVal,
        external_id: ext("agi-product", p),
        status: p.is_active === 0 || p.is_active === false ? "inactive" : "available",
      }),
      lines: price
        ? [{ line_group: "variants", data: compact({ variant_name: "Default", variant_price: price }) }]
        : undefined,
    });
    productRows.push(result);
    const rec = productByExt.get(ext("agi-product", p)) || productByExt.get(String(p.external_id || ""));
    if (rec?.id) agiProductToVba.set(String(p.id), rec.id);
  }

  const credRows = [];
  const primaryUuid = orgResult.primary.id;
  for (const c of credentials.rows) {
    const configuration = configToString(credentialSecrets.get(c.id));
    credRows.push(
      await upsertRecord(
        BASE,
        headers,
        credByExt,
        {
          type_api_name: "vendor_credential",
          parent_kind: "collaboration",
          parent_api_name: "vendor",
          name: c.name || `Credential ${c.id}`,
          org_id: primaryUuid,
          data: compact({
            auth_type: c.auth_type || "custom",
            organization_id: primaryUuid,
            configuration,
            notes: c.notes,
            external_id: `agi-cred:${c.id}`,
          }),
        },
        { updateIfPresent: true },
      ),
    );
  }

  const waveOrg = byExt.get(String(WAVE_VENDOR_ID));
  const integRows = [];
  integRows.push(
    await upsertRecord(BASE, headers, integByExt, {
      type_api_name: "vendor_integration",
      parent_kind: "collaboration",
      parent_api_name: "vendor",
      name: "Wave Accounting",
      org_id: waveOrg?.id,
      data: compact({
        kind: "accounting",
        status: "connected",
        organization_id: waveOrg?.id,
        notes: "Synthesized from host Organization Wave sync. Secrets not copied. Host Wave→org.db stays on until production cutover.",
        external_id: "agi-integration:wave",
      }),
    }),
  );
  const waveInteg = integByExt.get("agi-integration:wave");

  function documentLines(rawLines) {
    return (rawLines || []).map((line) => ({
      line_group: "items",
      data: compact({
        line_description: line.description,
        line_quantity: line.quantity != null ? String(line.quantity) : undefined,
        line_unit_price: centsToDecimal(line.unit_price_cents),
        line_total: centsToDecimal(line.total_cents),
        line_product_id: line.product_id != null ? agiProductToVba.get(String(line.product_id)) : undefined,
      }),
    }));
  }

  const invoiceRows = [];
  for (const inv of invoices.rows) {
    const issuer = orgUuid(byExt, inv.org_id);
    const customer = orgUuid(byExt, inv.customer_org_id);
    const num = inv.invoice_number || String(inv.id);
    invoiceRows.push(
      await upsertRecord(BASE, headers, txnByExt, {
        type_api_name: "treasury_transaction",
        parent_kind: "faculty",
        parent_api_name: "treasury",
        name: `Invoice ${num}`,
        status: inv.status || "draft",
        org_id: issuer,
        data: compact({
          document_kind: "invoice",
          document_number: str(num),
          classification: "income",
          transaction_date: inv.issue_date,
          due_date: inv.due_date,
          paid_date: inv.paid_date,
          amount: centsToDecimal(inv.total_cents),
          subtotal: centsToDecimal(inv.subtotal_cents),
          tax_total: centsToDecimal(inv.tax_total_cents),
          currency: inv.currency || "USD",
          status: inv.status,
          notes: inv.notes,
          issuer_organization_id: issuer,
          counterparty_organization_id: customer,
          external_id: ext("agi-invoice", inv),
        }),
        lines: documentLines(itemsByInvoice.get(String(inv.id))),
      }),
    );
  }

  const estimateRows = [];
  for (const est of estimates.rows) {
    const issuer = orgUuid(byExt, est.org_id);
    const customer = orgUuid(byExt, est.customer_org_id);
    const num = est.estimate_number || String(est.id);
    estimateRows.push(
      await upsertRecord(BASE, headers, txnByExt, {
        type_api_name: "treasury_transaction",
        parent_kind: "faculty",
        parent_api_name: "treasury",
        name: `Estimate ${num}`,
        status: est.status || "draft",
        org_id: issuer,
        data: compact({
          document_kind: "estimate",
          document_number: str(num),
          classification: "income",
          transaction_date: est.issue_date,
          expiry_date: est.expiry_date,
          amount: centsToDecimal(est.total_cents),
          subtotal: centsToDecimal(est.subtotal_cents),
          tax_total: centsToDecimal(est.tax_total_cents),
          currency: est.currency || "USD",
          status: est.status,
          notes: est.notes,
          issuer_organization_id: issuer,
          counterparty_organization_id: customer,
          external_id: ext("agi-estimate", est),
        }),
        lines: documentLines(itemsByEstimate.get(String(est.id))),
      }),
    );
  }

  const converted = [];
  for (const est of estimates.rows) {
    if (!est.converted_to_invoice_id) continue;
    const estRec = txnByExt.get(ext("agi-estimate", est));
    const invSrc = invoices.rows.find((i) => i.id === est.converted_to_invoice_id);
    const invRec = invSrc ? txnByExt.get(ext("agi-invoice", invSrc)) : null;
    if (!estRec?.id || !invRec?.id) continue;
    const patched = await patchRecord(BASE, headers, invRec.id, { converted_from_id: estRec.id });
    converted.push({ estimate: estRec.id, invoice: invRec.id, ...patched });
  }

  const txnRows = [];
  for (const t of transactions.rows) {
    const books = orgUuid(byExt, t.org_id);
    const counter = orgUuid(byExt, t.counterparty_org_id);
    const amount = centsToDecimal(t.amount_cents);
    const n = Number(t.amount_cents);
    txnRows.push(
      await upsertRecord(BASE, headers, txnByExt, {
        type_api_name: "treasury_transaction",
        parent_kind: "faculty",
        parent_api_name: "treasury",
        name: t.description || `Transaction ${t.id}`,
        org_id: books,
        data: compact({
          document_kind: "transaction",
          classification: Number.isFinite(n) && n < 0 ? "disbursement" : "income",
          transaction_date: t.transaction_date,
          amount,
          currency: t.currency || "USD",
          category: t.category || t.account_name,
          notes: t.description,
          issuer_organization_id: books,
          counterparty_organization_id: counter,
          external_id: ext("agi-txn", t),
        }),
      }),
    );
  }

  const exchRows = [];
  for (const e of exchange.rows) {
    exchRows.push(
      await upsertRecord(BASE, headers, exchByExt, {
        type_api_name: "vendor_exchange",
        parent_kind: "collaboration",
        parent_api_name: "vendor",
        name: e.name || `Exchange ${e.id}`,
        org_id: orgUuid(byExt, e.target_org_id) || waveOrg?.id,
        data: compact({
          origin: e.origin || "integration",
          status: e.status || "ok",
          integration_id: waveInteg?.id,
          source_organization_id: orgUuid(byExt, e.source_org_id),
          target_organization_id: orgUuid(byExt, e.target_org_id),
          source_table: e.source_table,
          source_id: e.source_id != null ? String(e.source_id) : undefined,
          replicate: boolStr(e.replicate),
          error_message: e.error_message,
          external_id: ext("agi-exchange", e),
        }),
      }),
    );
  }

  report.apply = {
    primary: orgResult.primary,
    organizations: {
      merged_primary: orgResult.merged,
      created: orgResult.created.length,
      updated: orgResult.updated.length,
      skipped: orgResult.skipped.length,
      skipped_detail: orgResult.skipped,
    },
    location: summarize(locations),
    contact: summarize(contacts),
    communication_staff: summarize(staff),
    production_product: summarize(productRows),
    vendor_credential: summarize(credRows),
    vendor_integration: summarize(integRows),
    treasury_invoice: summarize(invoiceRows),
    treasury_estimate: summarize(estimateRows),
    treasury_transaction: summarize(txnRows),
    converted_from_links: converted,
    vendor_exchange: summarize(exchRows),
  };
}

console.log(JSON.stringify(report, null, 2));
