import type { Organization, OrgType } from "@/lib/data/types";

/** The Primary Org owns default org_id relations. Additional Orgs (org_type=internal) are other businesses, not Collaboration parties. */
export function isPrimaryOrganization(org: Organization): boolean {
  if (org.is_primary === true) return true;
  return org.data?.is_primary === true;
}

export function primaryOrganization(orgs: Organization[]): Organization | undefined {
  return orgs.find(isPrimaryOrganization) ?? orgs.find((o) => o.org_type === "internal");
}

export function assertCanCreateOrg(_existing: Organization[], _orgType: OrgType): void {
  // Additional Orgs (org_type=internal) are allowed. Only one record is Primary.
}

export function assertCanDeleteOrg(org: Organization): void {
  if (isPrimaryOrganization(org)) {
    throw new Error("VALIDATION: the Primary Org cannot be deleted.");
  }
}

export function assertCanUpdateOrg(
  existing: Organization,
  nextType?: OrgType,
): void {
  if (!isPrimaryOrganization(existing)) return;
  if (nextType !== undefined && nextType !== "internal") {
    throw new Error("VALIDATION: the Primary Org type cannot be changed.");
  }
}

export function markPrimary(org: Organization): Organization {
  return {
    ...org,
    is_primary: true,
    data: { ...(org.data ?? {}), is_primary: true },
  };
}
