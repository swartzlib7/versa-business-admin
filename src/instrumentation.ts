/**
 * Server-only boot. Next.js awaits this once before serving requests, so site settings
 * are in memory (from Postgres) before any page or route reads them.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { hydrateSiteSettings } = await import("./lib/fixtures/site-settings");
    const { fresh } = await hydrateSiteSettings();
    if (fresh) {
      const { markSitePackPending } = await import("./lib/site-pack");
      markSitePackPending();
    }
    // 1.0.21: the install time zone is written once, from the host, then never floats.
    const { ensureInstallTimeZone } = await import("./lib/settings/install-time-zone");
    const written = ensureInstallTimeZone();
    if (written) {
      const { flushSiteSettings } = await import("./lib/fixtures/site-settings");
      await flushSiteSettings();
      console.log(`Install time zone set to ${written} (the host's zone). Settings → Modes changes it.`);
    }
    await import("./lib/catalog/install-durable");
  }
}
