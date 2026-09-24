import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { elementConfig, recordLine } from "@/lib/db/schema";
import { primaryOrganization, isPrimaryOrganization } from "@/lib/organizations/primary-org";
import {
  createInstance,
  deleteInstance,
  listInstances,
} from "@/lib/fixtures/record-instances";
import { installDemoCanvas, resetDemoCanvas } from "@/lib/sample-data/demo-install";
import {
  SAMPLE_ORGS,
  SAMPLE_RECORDS,
  SAMPLE_USERS,
  isSampleExternalId,
  sampleExternalId,
  type SampleOrgSeed,
} from "@/lib/sample-data/pack";
import type { Organization } from "@/lib/data/types";
import { isInstallUserEmail } from "@/lib/fixtures/users";

const FLAG = "__versaSampleDataHydrated__";
const FILE_PATH = path.join(process.cwd(), ".data", "sample-data.json");

type SampleFlag = {
  inserted: boolean;
  updated_at: string;
};

function readFlag(): SampleFlag {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE_PATH, "utf8")) as Partial<SampleFlag>;
    return {
      inserted: parsed.inserted === true,
      updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : "",
    };
  } catch {
    return { inserted: false, updated_at: "" };
  }
}

function writeFlag(inserted: boolean): void {
  const next: SampleFlag = { inserted, updated_at: new Date().toISOString() };
  try {
    fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(next, null, 2));
  } catch (err) {
    console.error("Failed to persist sample-data flag:", err);
  }
}

function orgExternalId(org: Organization): string | undefined {
  const fromData = org.data?.external_id;
  return typeof fromData === "string" ? fromData : undefined;
}

function existingOrg(orgs: Organization[], seed: SampleOrgSeed): Organization | undefined {
  return orgs.find((o) => orgExternalId(o) === seed.external_id);
}

async function listOrgs(): Promise<Organization[]> {
  const { adapter } = await import("@/lib/data/adapter");
  const rows = adapter.listOrganizations ? await adapter.listOrganizations() : [];
  return [...rows];
}

async function allRecords() {
  const { adapter } = await import("@/lib/data/adapter");
  if (adapter.listRecords) return adapter.listRecords({});
  return listInstances({});
}

function userExternalId(user: { data?: Record<string, unknown>; email?: string }): string | undefined {
  const fromData = user.data?.external_id;
  return typeof fromData === "string" ? fromData : undefined;
}

async function listUsers() {
  const { adapter } = await import("@/lib/data/adapter");
  return adapter.listUsers();
}

export async function sampleDataStatus(): Promise<{
  inserted: boolean;
  org_count: number;
  record_count: number;
  user_count: number;
}> {
  await hydrateSampleData();
  const orgs = await listOrgs();
  const orgCount = orgs.filter((o) => isSampleExternalId(orgExternalId(o))).length;
  const recordCount = (await allRecords()).filter((r) =>
    isSampleExternalId(r.data?.external_id),
  ).length;
  const userCount = (await listUsers()).filter((u) =>
    isSampleExternalId(userExternalId(u)),
  ).length;
  return {
    inserted: readFlag().inserted || orgCount + recordCount + userCount > 0,
    org_count: orgCount,
    record_count: recordCount,
    user_count: userCount,
  };
}

export async function insertSampleData(): Promise<{
  inserted: boolean;
  org_count: number;
  record_count: number;
  user_count: number;
  created_orgs: number;
  created_records: number;
  created_users: number;
}> {
  const { adapter } = await import("@/lib/data/adapter");
  (globalThis as Record<string, unknown>)[FLAG] = true;
  if (!adapter.createOrganization) {
    throw new Error("Organizations adapter is not available.");
  }
  let orgs = await listOrgs();
  const primary = primaryOrganization(orgs);
  let createdOrgs = 0;
  for (const seed of SAMPLE_ORGS) {
    const alreadyOrg = existingOrg(orgs, seed);
    if (alreadyOrg) {
      if (seed.logo_url && adapter.updateOrganization) {
        await adapter.updateOrganization(alreadyOrg.id, { data: { logo_url: seed.logo_url } });
      }
      continue;
    }
    await adapter.createOrganization({
      name: seed.name,
      org_type: seed.org_type,
      data: {
        external_id: seed.external_id,
        name: seed.name,
        notes: seed.notes ?? "",
        email: seed.email ?? "",
        phone: seed.phone ?? "",
        logo_url: seed.logo_url ?? "",
        is_active: true,
      },
    });
    createdOrgs += 1;
  }
  orgs = await listOrgs();
  const byExternal = new Map(
    orgs.filter((o) => orgExternalId(o)).map((o) => [orgExternalId(o) as string, o.id]),
  );
  const existingByExternal = new Map(
    (await allRecords())
      .filter((row) => isSampleExternalId(row.data?.external_id))
      .map((row) => [row.data.external_id as string, row]),
  );
  const idByExternal = new Map<string, string>(byExternal);
  for (const [externalId, row] of existingByExternal) idByExternal.set(externalId, row.id);
  const resolve = (data: Record<string, string>, refs?: Record<string, string>) => {
    const next = { ...data };
    for (const [field, externalId] of Object.entries(refs ?? {})) {
      const id = idByExternal.get(externalId);
      if (id) next[field] = id;
    }
    return next;
  };
  let createdRecords = 0;
  for (const seed of SAMPLE_RECORDS) {
    const data = resolve(seed.data, seed.refs);
    const lines = (seed.lines ?? []).map((line) => ({
      data: resolve(line.data, line.refs),
    }));
    const relations = (seed.relations ?? []).flatMap((rel) => {
      const recordId = idByExternal.get(rel.target_external_id);
      return recordId ? [{ record_id: recordId, relation_kind: rel.relation_kind }] : [];
    });
    const already = existingByExternal.get(seed.data.external_id);
    if (already) {
      if (
        adapter.updateRecord &&
        (seed.type_api_name === "page" || seed.refs || seed.type_api_name === "inspection_report")
      ) {
        await adapter.updateRecord(already.id, {
          name: seed.name,
          status: seed.status,
          data,
          ...(seed.type_api_name === "inspection_report" ? { lines } : {}),
        });
      }
      continue;
    }
    const orgId =
      (seed.org_external_id ? byExternal.get(seed.org_external_id) : undefined) ??
      primary?.id;
    if (
      orgId &&
      (seed.type_api_name === "contact" ||
        seed.type_api_name === "communication_staff" ||
        seed.type_api_name === "location")
    ) {
      data.organization_id = orgId;
    }
    if (orgId && seed.type_api_name === "treasury_transaction") {
      data.counterparty_organization_id = orgId;
    }
    const input = {
      type_api_name: seed.type_api_name,
      parent_kind: seed.parent_kind,
      parent_api_name: seed.parent_api_name,
      name: seed.name,
      status: seed.status,
      data,
      org_id: orgId,
      ...(lines.length ? { lines } : {}),
      ...(relations.length ? { relations } : {}),
    };
    const result = adapter.createRecord
      ? await adapter.createRecord(input)
      : createInstance(input);
    if (result.ok) {
      createdRecords += 1;
      idByExternal.set(seed.data.external_id, result.instance.id);
    }
  }
  let createdUsers = 0;
  if (adapter.createUser) {
    const existingUsers = await listUsers();
    const byEmail = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const byExternal = new Set(
      existingUsers.map((u) => userExternalId(u)).filter((id): id is string => isSampleExternalId(id)),
    );
    for (const seed of SAMPLE_USERS) {
      const externalId = sampleExternalId("user", seed.key);
      if (isInstallUserEmail(seed.email)) continue;
      if (byEmail.has(seed.email.toLowerCase()) || byExternal.has(externalId)) continue;
      await adapter.createUser({
        email: seed.email,
        name: seed.name,
        role: seed.role,
        type: seed.type,
        status: "active",
        department: seed.department,
        bio: seed.bio,
        password: seed.password,
        data: {
          external_id: externalId,
          job_title: seed.job_title ?? seed.bio,
        },
      });
      createdUsers += 1;
    }
  }
  await installDemoCanvas();
  writeFlag(true);
  const status = await sampleDataStatus();
  return {
    inserted: true,
    org_count: status.org_count,
    record_count: status.record_count,
    user_count: status.user_count,
    created_orgs: createdOrgs,
    created_records: createdRecords,
    created_users: createdUsers,
  };
}

export async function deleteSampleData(): Promise<{
  inserted: boolean;
  deleted_orgs: number;
  deleted_records: number;
  deleted_users: number;
}> {
  const { adapter } = await import("@/lib/data/adapter");
  let deletedRecords = 0;
  for (const rec of await allRecords()) {
    if (!isSampleExternalId(rec.data?.external_id)) continue;
    const ok = adapter.deleteRecord
      ? await adapter.deleteRecord(rec.id)
      : deleteInstance(rec.id);
    if (ok) deletedRecords += 1;
  }
  let deletedOrgs = 0;
  const orgs = await listOrgs();
  const sampleIds = orgs
    .filter((org) => isSampleExternalId(orgExternalId(org)) && !isPrimaryOrganization(org))
    .map((org) => org.id);
  for (const id of sampleIds) {
    if (!adapter.deleteOrganization) continue;
    const db = getDb();
    await db.delete(elementConfig).where(eq(elementConfig.orgId, id));
    await db.delete(recordLine).where(eq(recordLine.organizationId, id));
    try {
      const ok = await adapter.deleteOrganization(id);
      if (ok) deletedOrgs += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Primary Org")) continue;
      throw err;
    }
  }
  let deletedUsers = 0;
  if (adapter.deleteUser) {
    for (const user of await listUsers()) {
      if (isInstallUserEmail(user.email)) continue;
      if (!isSampleExternalId(userExternalId(user))) continue;
      const ok = await adapter.deleteUser(user.id);
      if (ok) deletedUsers += 1;
    }
  }
  resetDemoCanvas();
  writeFlag(false);
  return {
    inserted: false,
    deleted_orgs: deletedOrgs,
    deleted_records: deletedRecords,
    deleted_users: deletedUsers,
  };
}

export async function hydrateSampleData(): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  if (g[FLAG]) return;
  g[FLAG] = true;
  if (!readFlag().inserted) return;
  await insertSampleData();
}
