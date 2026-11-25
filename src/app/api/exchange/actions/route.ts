import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";

/**
 * Integration buttons (1.0.20), admin only:
 *   run      → run this Integration now (push: send what is waiting; pull: ask now)
 *   resend   → push: queue every record that passes the lines again (safe: the receiver upserts)
 *   repull   → pull: clear the markers, so the next pull asks for everything that matches
 */
export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin session required." } }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { integration_id?: string; action?: string };
  const { adapter } = await import("@/lib/data/adapter");
  const integration = body.integration_id && adapter.getRecord ? await adapter.getRecord(body.integration_id) : null;
  if (!integration || integration.type_api_name !== "vendor_integration") {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Integration not found." } }, { status: 404 });
  }
  const direction = String(integration.data?.direction ?? "");
  const mode = String(integration.data?.mode ?? "push");
  if (body.action === "run") {
    const { runIntegrationNow } = await import("@/lib/integrations/engine");
    return NextResponse.json({ data: { message: await runIntegrationNow(integration.id) } });
  }
  if (body.action === "resend" && direction === "send" && mode === "push") {
    const { resendAll } = await import("@/lib/integrations/queue");
    const count = await resendAll(integration);
    return NextResponse.json({ data: { message: `Queued ${count} item(s). They go out on the next run.` } });
  }
  if (body.action === "repull" && direction === "receive" && mode === "pull") {
    const lines = (integration.lines ?? []).map((l) => ({ id: l.id, line_group: l.line_group, data: { ...l.data, flow_pull_marker: "" } }));
    await adapter.updateRecord?.(integration.id, { lines });
    return NextResponse.json({ data: { message: "The next pull asks for everything that matches." } });
  }
  return NextResponse.json({ error: { code: "BAD_REQUEST", message: "That action does not apply to this Integration." } }, { status: 400 });
}
