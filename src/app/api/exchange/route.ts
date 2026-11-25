import { installTimeZone } from "@/lib/settings/install-time-zone";
import { isTimeZone } from "@/lib/statistics/time-zone";
import { NextResponse } from "next/server";
import { authenticateToken, lineFor } from "@/lib/integrations/token-auth";
import { applyItems } from "@/lib/integrations/receive";
import { servePull } from "@/lib/integrations/serve";
import { EXCHANGE_VERSION, type ExchangeItem } from "@/lib/integrations/items";
import { MAX_ITEMS } from "@/lib/integrations/rules";
import { parsePairingFilter } from "@/lib/public/pairing-filter";

/**
 * VBA-to-VBA exchange (1.0.20, state_integrations.md §3.6, §3.8). Access token only
 * (Authorization: Bearer vba_…), never a session cookie.
 *   POST: receive pushed items (this side: an Integration receive + push).
 *   GET:  answer a pull (this side: an Integration send + pull).
 */

const MAX_BODY_BYTES = 5 * 1024 * 1024;

function bad(status: number, code: string, message: string) {
  return NextResponse.json({ vba_exchange: EXCHANGE_VERSION, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const auth = await authenticateToken(request);
  if (!auth.ok) return auth.response;
  const integration = auth.identity.integrations.find(
    (i) => i.data?.direction === "receive" && String(i.data?.mode ?? "push") === "push",
  );
  if (!integration) return bad(403, "FORBIDDEN", "This token's Integration does not receive pushes.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return bad(413, "TOO_LARGE", "At most 5 MB per request.");
  let body: { vba_exchange?: unknown; time_zone?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad(400, "BAD_REQUEST", "The body must be JSON.");
  }
  if (body.vba_exchange !== EXCHANGE_VERSION) {
    return bad(400, "VERSION", `This install speaks exchange version ${EXCHANGE_VERSION}. Upgrade both installs to the same release.`);
  }
  if (!Array.isArray(body.items)) return bad(400, "BAD_REQUEST", "items must be a list.");
  if (body.items.length > MAX_ITEMS) return bad(400, "TOO_MANY", `At most ${MAX_ITEMS} items per request.`);
  // 1.0.21: the sender's install zone; a statistic from an older sender takes it when it carries none.
  const senderTimeZone = isTimeZone(body.time_zone) ? body.time_zone : undefined;
  const results = await applyItems({ integration, userId: auth.identity.session.userId, senderTimeZone }, body.items as ExchangeItem[]);
  return NextResponse.json({ vba_exchange: EXCHANGE_VERSION, results });
}

export async function GET(request: Request) {
  const auth = await authenticateToken(request);
  if (!auth.ok) return auth.response;
  const integration = auth.identity.integrations.find((i) => i.data?.direction === "send" && i.data?.mode === "pull");
  if (!integration) return bad(403, "FORBIDDEN", "This token's Integration does not answer pulls.");
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") ?? "").trim();
  const line = type ? lineFor(integration, type) : null;
  if (!line) return bad(403, "FORBIDDEN", type ? `${type} is not shared by this Integration.` : "type is required.");
  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : null;
  if (since && Number.isNaN(since.getTime())) return bad(400, "BAD_REQUEST", "since must be a date and time.");
  const cursor = Math.max(0, Number(url.searchParams.get("cursor") ?? 0) || 0);
  const marker = url.searchParams.get("marker") ?? undefined;
  const answer = await servePull({
    integration,
    line,
    type,
    since,
    filter: parsePairingFilter(url.searchParams.get("filter")),
    cursor,
    marker: marker && !Number.isNaN(Date.parse(marker)) ? marker : undefined,
  });
  return NextResponse.json({ vba_exchange: EXCHANGE_VERSION, time_zone: installTimeZone(), ...answer });
}
