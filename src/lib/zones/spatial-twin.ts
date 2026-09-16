import { businessGraphNodes, HUB_CENTER_ID } from "@/lib/fixtures/business-graph";

/**
 * Spatial Twin is wired to every record type the zone presents — element
 * tabs and the sub-tab strip (child record types). Default hub spheres are
 * the built-in element list. Environment → Custom has no sphere yet, so the
 * twin pane is hidden there (no Locations fallback). Other types not on the
 * graph still get a feature preview until a sphere exists for that id.
 */
export function hasSpatialTwin(nodeId: string | null | undefined): boolean {
  if (!nodeId) return false;
  return businessGraphNodes.some((n) => n.id === nodeId);
}

/** Hub sphere to highlight when the selected tab/sub-tab is not itself a graph node. */
const ZONE_HUB_FALLBACK: Record<string, string> = {
  organization: HUB_CENTER_ID,
  collaboration: "vendor",
  environment: "locations",
};

const ENVIRONMENT_HUB_TABS = new Set(["locations", "events", "knowledge", "schedules"]);

/**
 * Keep the 3D hub loaded while staff are on a named child (Policies, Contacts, …).
 * Prefer a real sphere id; otherwise the zone’s default hub node.
 * Environment → Custom has no sphere yet — do not fall back to Locations.
 * Preview-only tabs (Statistics / environment_stat) also skip the Locations hub.
 */
export function twinFocusNodeId(
  zoneId: string,
  tabId: string | null | undefined,
  childId: string | null | undefined,
): string | null {
  if (tabId === "custom") return null;
  if (hasSpatialTwin(childId)) return childId ?? null;
  if (hasSpatialTwin(tabId)) return tabId ?? null;
  if (zoneId === "environment" && tabId && !ENVIRONMENT_HUB_TABS.has(tabId)) {
    return null;
  }
  return ZONE_HUB_FALLBACK[zoneId] ?? tabId ?? childId ?? null;
}
