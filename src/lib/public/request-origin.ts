import { headers } from "next/headers";

/** The public origin of the current request, honoring a reverse proxy's forwarded host and protocol. */
export async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = (list.get("x-forwarded-host") ?? list.get("host") ?? "localhost").split(",")[0].trim();
  const forwarded = list.get("x-forwarded-proto")?.split(",")[0].trim();
  const local = /^(localhost|127\.|\[::1\])/.test(host);
  const proto = forwarded || (local ? "http" : "https");
  return `${proto}://${host}`;
}
