import { NextResponse } from "next/server";
import { issueLoginChallenge } from "@/lib/auth-challenge";

/** GET /api/auth/challenge — proof-of-work token for login. */
export async function GET() {
  return NextResponse.json({ data: issueLoginChallenge() });
}
