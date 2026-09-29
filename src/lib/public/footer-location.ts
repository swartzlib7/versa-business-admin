import { adapter } from "@/lib/data/adapter";
import { createInstance, listInstances } from "@/lib/fixtures/record-instances";
import { business } from "@/lib/fixtures/business";
import { primaryOrganization } from "@/lib/organizations/primary-org";
import { isPrimaryAddress, locationOrgKey } from "@/lib/records/location-primary";

const LOCATION_TYPE = "location";
/** Default Location created when the install has none. The footer reads the record. */
const DEFAULT_EXTERNAL_ID = "ba_site:footer-location";

type LocationRow = {
  id: string;
  org_id?: string;
  data?: Record<string, unknown>;
};

function text(data: Record<string, unknown> | undefined, key: string): string {
  const value = data?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function stringData(data: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (typeof value === "string") out[key] = value;
    else if (typeof value === "boolean") out[key] = value ? "true" : "false";
  }
  return out;
}

/** Street block for the footer. The Address field wins; otherwise the structured lines. */
export function locationAddress(data: Record<string, unknown> | undefined): string {
  const written = text(data, "address");
  if (written) return written;
  const cityLine = [text(data, "city"), text(data, "state"), text(data, "postal_code")]
    .filter(Boolean)
    .join(", ");
  return [text(data, "line_1"), text(data, "line_2"), cityLine, text(data, "country")]
    .filter(Boolean)
    .join(", ");
}

async function listLocations(): Promise<LocationRow[]> {
  const rows = adapter.listRecords
    ? await adapter.listRecords({ type_api_name: LOCATION_TYPE })
    : listInstances({ type_api_name: LOCATION_TYPE });
  return rows as LocationRow[];
}

async function primaryOrgId(): Promise<string> {
  const orgs = adapter.listOrganizations ? await adapter.listOrganizations() : [];
  return primaryOrganization(orgs)?.id ?? "";
}

function forOrg(rows: LocationRow[], orgId: string): LocationRow[] {
  if (!orgId) return rows;
  return rows.filter((row) => locationOrgKey(row.data, row.org_id ?? "") === orgId);
}

/** The Primary Org's Location with Primary address on. */
export function pickFooterLocation(rows: LocationRow[], orgId: string): LocationRow | undefined {
  const mine = forOrg(rows, orgId);
  return (
    mine.find((row) => isPrimaryAddress(row.data?.is_primary)) ??
    mine.find((row) => text(row.data, "external_id") === DEFAULT_EXTERNAL_ID) ??
    mine[0]
  );
}

/** One primary Location linked to the Primary Org. Address and phone start on that record. */
export async function ensureFooterLocation(): Promise<void> {
  const orgId = await primaryOrgId();
  const existing = await listLocations();
  const linked = forOrg(existing, orgId);
  const current = linked.find((row) => isPrimaryAddress(row.data?.is_primary));
  if (current) {
    const needsLink = Boolean(orgId) && text(current.data, "organization_id") !== orgId;
    const needsEmail = !Object.prototype.hasOwnProperty.call(current.data ?? {}, "email");
    if (needsLink || needsEmail) {
      await linkLocation(current, orgId || text(current.data, "organization_id"));
    }
    return;
  }
  const shipped = existing.find((row) => text(row.data, "external_id") === DEFAULT_EXTERNAL_ID);
  if (shipped) {
    await linkLocation(shipped, orgId);
    return;
  }
  const input = {
    id: "loc-footer",
    type_api_name: LOCATION_TYPE,
    parent_kind: "environment" as const,
    parent_api_name: "locations",
    name: "Primary",
    status: "active",
    org_id: orgId || undefined,
    data: {
      name: "Primary",
      address: business.address,
      phone: business.contactPhone,
      email: business.contactEmail,
      is_primary: "true",
      organization_id: orgId,
      status: "active",
      external_id: DEFAULT_EXTERNAL_ID,
    },
  };
  try {
    const created = adapter.createRecord
      ? await adapter.createRecord(input, { createdBy: "user-coa" })
      : createInstance(input);
    if (created.ok === false && !/already exists/i.test(created.message)) {
      throw new Error(created.message);
    }
  } catch (err) {
    const cause = err instanceof Error ? (err as Error & { cause?: unknown }).cause : undefined;
    const message = [err, cause]
      .map((item) => (item instanceof Error ? item.message : String(item ?? "")))
      .join(" ");
    if (!/duplicate key|already exists/i.test(message)) throw err;
  }
}

async function linkLocation(row: LocationRow, orgId: string): Promise<void> {
  if (!orgId) return;
  const data = {
    ...stringData(row.data),
    organization_id: orgId,
    is_primary: "true",
    email: Object.prototype.hasOwnProperty.call(row.data ?? {}, "email")
      ? text(row.data, "email")
      : business.contactEmail,
  };
  if (adapter.updateRecord) {
    const updated = await adapter.updateRecord(row.id, { data, org_id: orgId });
    if (updated.ok === false) throw new Error(updated.message);
    return;
  }
  const { updateInstance } = await import("@/lib/fixtures/record-instances");
  const updated = updateInstance(row.id, { data, org_id: orgId });
  if (updated.ok === false) throw new Error(updated.message);
}

export async function footerContact(): Promise<{ email: string; phone: string; address: string }> {
  const orgId = await primaryOrgId();
  await ensureFooterLocation();
  const row = pickFooterLocation(await listLocations(), orgId);
  return {
    email: text(row?.data, "email"),
    phone: text(row?.data, "phone"),
    address: locationAddress(row?.data),
  };
}
