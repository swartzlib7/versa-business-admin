/**
 * Public Contacts section: Location or Contact record → related Organization.
 * Phone / email prefer the record, then the org. Address comes from the Location
 * (or Contact has none). Listing home is Organization → Distribution → Contacts.
 */
import { adapter } from "@/lib/data";
import type { Organization } from "@/lib/data/types";
import type { RecordInstance } from "@/lib/fixtures/record-instances";

export type PublicContactCard = { email: string; phone: string; address: string };

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

function pickPreferred(rows: RecordInstance[]): RecordInstance | undefined {
  if (!rows.length) return undefined;
  return rows.find((r) => /^(true|1|yes)$/i.test(str(r.data, "is_primary"))) ?? rows[0];
}

async function orgFor(record: RecordInstance | undefined): Promise<Organization | null> {
  const id = str(record?.data, "organization_id");
  if (!id || !adapter.getOrganization) return null;
  try {
    return await adapter.getOrganization(id);
  } catch {
    return null;
  }
}

export async function resolvePublicContacts(): Promise<PublicContactCard | undefined> {
  if (!adapter.listRecords) return undefined;
  let contacts: RecordInstance[] = [];
  let locations: RecordInstance[] = [];
  try {
    [contacts, locations] = await Promise.all([
      adapter.listRecords({ type_api_name: "contact" }),
      adapter.listRecords({ type_api_name: "location" }),
    ]);
  } catch {
    return undefined;
  }

  const contact = pickPreferred(contacts);
  const location = pickPreferred(locations);
  const seed = contact ?? location;
  if (!seed) return undefined;

  const org = await orgFor(seed);
  const orgData = org?.data;
  const email = str(contact?.data, "email") || str(orgData, "email");
  const phone = str(contact?.data, "phone") || str(orgData, "phone");
  const address = locationAddress(location?.data);
  if (!email && !phone && !address) return undefined;
  return { email, phone, address };
}
