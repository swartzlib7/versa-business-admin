import type { Organization } from "@/lib/data/types";
import type { RecordInstance } from "@/lib/fixtures/record-instances";

export type PublicContactCard = {
  name?: string;
  orgName?: string;
  email: string;
  phone: string;
  address: string;
};

function str(data: Record<string, unknown> | undefined, key: string): string {
  const v = data?.[key];
  return typeof v === "string" ? v.trim() : "";
}

function locationAddress(data: Record<string, unknown> | undefined): string {
  const block = str(data, "address");
  if (block) return block;
  return [str(data, "line_1"), str(data, "line_2"), str(data, "city"), str(data, "state"), str(data, "postal_code")]
    .filter(Boolean)
    .join(", ");
}

export function contactCardFromSeed(
  seed: RecordInstance | undefined,
  org: Organization | null,
): PublicContactCard | undefined {
  if (!seed) return undefined;
  const orgData = org?.data;
  const isLocation = seed.type_api_name === "location";
  const email = isLocation ? str(orgData, "email") : str(seed.data, "email") || str(orgData, "email");
  const phone = isLocation ? str(orgData, "phone") : str(seed.data, "phone") || str(orgData, "phone");
  const address = isLocation
    ? locationAddress(seed.data)
    : str(orgData, "address") || locationAddress(orgData);
  const name = str(seed.data, "name");
  const orgName = str(orgData, "name");
  if (!email && !phone && !address && !name) return undefined;
  return { name, orgName, email, phone, address };
}

export function pickPreferredContact(rows: RecordInstance[]): RecordInstance | undefined {
  if (!rows.length) return undefined;
  return rows.find((r) => /^(true|1|yes)$/i.test(str(r.data, "is_primary"))) ?? rows[0];
}

export function organizationIdOf(record: { data?: Record<string, unknown> } | undefined): string {
  return str(record?.data, "organization_id");
}

export function composeListedContacts(
  contact: RecordInstance | undefined,
  location: RecordInstance | undefined,
  org: Organization | null,
): PublicContactCard | undefined {
  const orgData = org?.data;
  const email = str(contact?.data, "email") || str(orgData, "email");
  const phone = str(contact?.data, "phone") || str(orgData, "phone");
  const address = locationAddress(location?.data);
  const name = str(location?.data, "name") || str(contact?.data, "name");
  const orgName = str(orgData, "name");
  if (!email && !phone && !address && !name) return undefined;
  return { name, orgName, email, phone, address };
}
