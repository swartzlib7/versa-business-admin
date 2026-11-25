import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdmin, isAuthenticated } from "@/lib/auth";
import { issueToken } from "@/lib/integrations/token-auth";

/**
 * 1.0.20 (state_integrations.md §3.2): issue an access token on a Credential.
 * Admin only. The token is in this answer and nowhere else; only its hash is kept.
 * Issuing again ends the previous token at once.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin session required." } }, { status: 403 });
  }
  const { id } = await context.params;
  const result = await issueToken(id);
  if (!result.ok) {
    return NextResponse.json({ error: { code: "TOKEN_NOT_ISSUED", message: result.message } }, { status: result.status });
  }
  return NextResponse.json(
    {
      data: {
        token: result.token,
        hint: result.hint,
        system_user_id: result.systemUserId,
        note: "Copy this token now: it is not shown again. Paste it on the calling side's Credential (Auth type: Access token, Configuration: {\"token\": \"…\"}).",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
