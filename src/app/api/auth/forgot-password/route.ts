import { NextResponse } from "next/server";
import { adapter } from "@/lib/data/adapter";
import { verifyLoginChallenge } from "@/lib/auth-challenge";
import { issueAccountToken } from "@/lib/auth/account-tokens";
import { requestOrigin } from "@/lib/public/request-origin";
import { mailIsActive, sendSystemMail } from "@/lib/mail/system-mail";
import { resetMessage } from "@/lib/mail/branded-message";

const SAME = "If that email has an account, a reset link is on its way.";

export async function POST(request: Request) {
  if (!(await mailIsActive())) {
    return NextResponse.json(
      {
        error: {
          code: "MAIL_NOT_CONFIGURED",
          message: "Password reset needs an active system mailbox. Set it in Settings → E-Mail Delivery.",
        },
      },
      { status: 409 },
    );
  }
  let body: { email?: string; challenge?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON." } }, { status: 400 });
  }
  if (!verifyLoginChallenge(body.challenge ?? {})) {
    return NextResponse.json(
      { error: { code: "CHALLENGE_FAILED", message: "Verification failed. Refresh and try again." } },
      { status: 400 },
    );
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const users = email ? await adapter.listUsers() : [];
  const user = users.find((row) => row.email.toLowerCase() === email && row.status === "active");
  if (user) {
    const token = await issueAccountToken(user.id, "password_reset");
    const origin = await requestOrigin();
    const message = resetMessage({ resetUrl: `${origin}/login/reset-password?token=${encodeURIComponent(token)}` });
    await sendSystemMail({ to: user.email, ...message });
  }
  return NextResponse.json({ data: { message: SAME } });
}
