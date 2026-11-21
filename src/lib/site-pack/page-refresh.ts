/**
 * Site-pack page refresh (1.0.16). The pack installs once, on a new site. When a
 * release ships new bodies for its Pages records (the Versa AGi slides and
 * styles), an install gets them only where the page is still exactly a body an
 * earlier pack shipped. A page edited on the install is left alone.
 * No disk or database access here, so it is unit-tested.
 */
import { createHash } from "node:crypto";

export type PageRefreshDecision = "current" | "update" | "edited";

export function bodyHash(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

/**
 * `installBody` is the page as stored (pack tokens put back), `packBody` the
 * current pack's body, `shipped` the hashes of bodies earlier packs shipped.
 */
export function decidePageRefresh(installBody: string, packBody: string, shipped: readonly string[]): PageRefreshDecision {
  if (installBody === packBody) return "current";
  return shipped.includes(bodyHash(installBody)) ? "update" : "edited";
}
