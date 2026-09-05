/**
 * D3 — catalog overlay is scoped to the Primary Org (one Org, not
 * multi-tenant login). Legacy rows used id "site".
 */
import { primaryOrganization } from "@/lib/organizations/primary-org";

export const LEGACY_CATALOG_OVERLAY_ID = "site";

export async function resolveCatalogOverlayId(): Promise<string> {
  try {
    const { adapter } = await import("@/lib/data/adapter");
    const orgs = adapter.listOrganizations ? await adapter.listOrganizations() : [];
    return primaryOrganization(orgs)?.id ?? LEGACY_CATALOG_OVERLAY_ID;
  } catch {
    return LEGACY_CATALOG_OVERLAY_ID;
  }
}
