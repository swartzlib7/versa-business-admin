/**
 * Server-only catalog overlay install. Next.js calls this once on Node boot.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/catalog/install-durable");
  }
}
