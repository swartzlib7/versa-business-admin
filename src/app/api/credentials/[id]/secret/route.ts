import { NextResponse } from "next/server";
import { openCredential } from "@/lib/integrations/credential-use";

/**
 * 1.0.20 (state_integrations.md §3.10): a Credential's plain Configuration, for a
 * person or agent on its Users list, signed in with their own account (a script signs
 * in as its agent). Use it in memory; never write it to a file or a log.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const opened = await openCredential(request, id);
  if (!opened.ok) return opened.response;
  let values: unknown = null;
  try {
    values = JSON.parse(opened.configuration);
  } catch {
    values = null;
  }
  return NextResponse.json(
    {
      data: {
        id: opened.credential.id,
        name: opened.credential.name,
        auth_type: String(opened.credential.data?.auth_type ?? ""),
        configuration: opened.configuration,
        values,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
