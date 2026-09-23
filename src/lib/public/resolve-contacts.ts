/**
 * Public Contacts section: Location or Contact record → related Organization.
 * Phone / email prefer the record, then the org. Address comes from the Location
 * (or Contact has none). Listing home is Organization → Distribution → Contacts.
 */
import { adapter } from "@/lib/data";
import type { Organization } from "@/lib/data/types";
import {
  composeListedContacts,
  contactCardFromSeed,
  organizationIdOf,
  pickPreferredContact,
  type PublicContactCard,
} from "@/lib/public/resolve-contact-card";

export type { PublicContactCard };
export { contactCardFromSeed };

async function orgFor(record: { data?: Record<string, unknown> } | undefined): Promise<Organization | null> {
  const id = organizationIdOf(record);
  if (!id || !adapter.getOrganization) return null;
  try {
    return await adapter.getOrganization(id);
  } catch {
    return null;
  }
}

/** PB-32: paint from the paired Contact or Location → Organization. */
export async function resolvePublicContactFromRecord(
  recordType: string,
  recordId: string,
): Promise<PublicContactCard | undefined> {
  if (!adapter.getRecord || !recordId) return undefined;
  const seed = await adapter.getRecord(recordId).catch(() => null);
  if (!seed) return undefined;
  const type = recordType === "location" || seed.type_api_name === "location" ? "location" : "contact";
  const typed = { ...seed, type_api_name: type };
  const org = await orgFor(typed);
  return contactCardFromSeed(typed, org);
}

export async function resolvePublicContacts(): Promise<PublicContactCard | undefined> {
  if (!adapter.listRecords) return undefined;
  let contacts = [];
  let locations = [];
  try {
    [contacts, locations] = await Promise.all([
      adapter.listRecords({ type_api_name: "contact" }),
      adapter.listRecords({ type_api_name: "location" }),
    ]);
  } catch {
    return undefined;
  }

  const contact = pickPreferredContact(contacts);
  const location = pickPreferredContact(locations);
  if (!contact && !location) return undefined;
  const org = await orgFor(contact ?? location);
  return composeListedContacts(contact, location, org);
}
