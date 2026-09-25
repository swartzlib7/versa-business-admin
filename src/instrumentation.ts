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
    await import("./lib/catalog/install-durable");
  }
}
