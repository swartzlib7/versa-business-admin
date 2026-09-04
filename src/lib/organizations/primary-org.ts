import type { Organization, OrgType } from "@/lib/data/types";

/** The one Org-type record that owns all org_id relations. Not multi-tenant. */
export function isPrimaryOrganization(org: Organization): boolean {
  if (org.is_primary === true) return true;
  return org.data?.is_primary === true;
}

export function primaryOrganization(orgs: Organization[]): Organization | undefined {
  return orgs.find(isPrimaryOrganization) ?? orgs.find((o) => o.org_type === "internal");
}

export function assertCanCreateOrg(existing: Organization[], orgType: OrgType): void {
  if (orgType === "internal" && existing.some((o) => o.org_type === "internal")) {
    throw new Error(
      "VALIDATION: there can be only one Org (the Primary Org). Other organizations are vendor, customer, partner, or branch.",
    );
  }
}

export function assertCanDeleteOrg(org: Organization): void {
  if (isPrimaryOrganization(org) || org.org_type === "internal") {
    throw new Error("VALIDATION: the Primary Org cannot be deleted.");
  }
}

export function assertCanUpdateOrg(
  existing: Organization,
  nextType?: OrgType,
): void {
  if (!(isPrimaryOrganization(existing) || existing.org_type === "internal")) return;
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
