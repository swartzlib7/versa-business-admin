import fs from "fs";
import path from "path";
import { primaryOrganization, isPrimaryOrganization } from "@/lib/organizations/primary-org";
import {
  createInstance,
  deleteInstance,
  listInstances,
} from "@/lib/fixtures/record-instances";
import {
  SAMPLE_ORGS,
  SAMPLE_RECORDS,
  isSampleExternalId,
  type SampleOrgSeed,
} from "@/lib/sample-data/pack";
import type { Organization } from "@/lib/data/types";

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

export async function sampleDataStatus(): Promise<{
  inserted: boolean;
  org_count: number;
  record_count: number;
}> {
  await hydrateSampleData();
  const orgs = await listOrgs();
  const orgCount = orgs.filter((o) => isSampleExternalId(orgExternalId(o))).length;
  const recordCount = (await allRecords()).filter((r) =>
    isSampleExternalId(r.data?.external_id),
  ).length;
  return {
    inserted: readFlag().inserted || orgCount + recordCount > 0,
    org_count: orgCount,
    record_count: recordCount,
  };
}

export async function insertSampleData(): Promise<{
  inserted: boolean;
  org_count: number;
  record_count: number;
  created_orgs: number;
  created_records: number;
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
    if (existingOrg(orgs, seed)) continue;
    await adapter.createOrganization({
      name: seed.name,
      org_type: seed.org_type,
      data: { external_id: seed.external_id, notes: seed.notes ?? "", is_active: true },
    });
    createdOrgs += 1;
  }
  orgs = await listOrgs();
  const byExternal = new Map(
    orgs.filter((o) => orgExternalId(o)).map((o) => [orgExternalId(o) as string, o.id]),
  );
  const existingIds = new Set(
    (await allRecords())
      .map((r) => r.data?.external_id)
      .filter((id): id is string => isSampleExternalId(id)),
  );
  let createdRecords = 0;
  for (const seed of SAMPLE_RECORDS) {
    if (existingIds.has(seed.data.external_id)) continue;
    const orgId =
      (seed.org_external_id ? byExternal.get(seed.org_external_id) : undefined) ??
      primary?.id;
    const data = { ...seed.data };
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
    };
    const result = adapter.createRecord
      ? await adapter.createRecord(input)
      : createInstance(input);
    if (result.ok) createdRecords += 1;
  }
  writeFlag(true);
  const status = await sampleDataStatus();
  return {
    inserted: true,
    org_count: status.org_count,
    record_count: status.record_count,
    created_orgs: createdOrgs,
    created_records: createdRecords,
  };
}

export async function deleteSampleData(): Promise<{
  inserted: boolean;
  deleted_orgs: number;
  deleted_records: number;
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
    try {
      const ok = await adapter.deleteOrganization(id);
      if (ok) deletedOrgs += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Primary Org")) continue;
      throw err;
    }
  }
  writeFlag(false);
  return { inserted: false, deleted_orgs: deletedOrgs, deleted_records: deletedRecords };
}

export async function hydrateSampleData(): Promise<void> {
  const g = globalThis as Record<string, unknown>;
  if (g[FLAG]) return;
  g[FLAG] = true;
  if (!readFlag().inserted) return;
  await insertSampleData();
}
