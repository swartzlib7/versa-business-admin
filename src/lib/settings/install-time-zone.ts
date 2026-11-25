/**
 * The install's time zone (1.0.21, state_statistics_environment.md "Time zones").
 * Server only. A statistic's own Time zone wins; this is the default for new statistics
 * and for any statistic stored before 1.0.21.
 */
import { getSiteSettingsFixture, upsertSiteSettingsFixture } from "@/lib/fixtures/site-settings";
import { hostTimeZone, isTimeZone } from "@/lib/statistics/time-zone";

export function installTimeZone(): string {
  const zone = getSiteSettingsFixture().time_zone;
  return isTimeZone(zone) ? zone : hostTimeZone();
}

/**
 * First start (fresh, or the upgrade to 1.0.21): write the host's zone once, so the install
 * no longer follows the process zone. Returns the zone written, or null when one was set.
 */
export function ensureInstallTimeZone(): string | null {
  if (isTimeZone(getSiteSettingsFixture().time_zone)) return null;
  const zone = hostTimeZone();
  upsertSiteSettingsFixture({ time_zone: zone });
  return zone;
}
