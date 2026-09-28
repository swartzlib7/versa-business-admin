import { NextResponse } from "next/server";
import { adapter } from "@/lib/data";
import { getSessionFromRequest, isAuthenticated, isAdmin } from "@/lib/auth";
import type { UpdateUserInput } from "@/lib/data/adapter";
import { passwordProblem } from "@/lib/password-policy";
import { issueAccountToken } from "@/lib/auth/account-tokens";
import { confirmEmailMessage, emailChangedNotice } from "@/lib/mail/branded-message";
import { mailIsActive, sendSystemMail } from "@/lib/mail/system-mail";
import { requestOrigin } from "@/lib/public/request-origin";

function notFound(id: string) {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "User " + id + " was not found." } },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const user = await adapter.getUser(id);

  if (!user) {
    return notFound(id);
  }

  return NextResponse.json({ data: user });
}

/** Phase 3 - update user (admin or self). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const isSelf = session!.userId === id;
  if (!isAdmin(session) && !isSelf) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin or self required to update user." } },
      { status: 403 },
    );
  }
  if (!adapter.updateUser) {
    return NextResponse.json(
      { error: { code: "NOT_IMPLEMENTED", message: "User update is not available." } },
      { status: 501 },
    );
  }

  let body: UpdateUserInput;
  try {
    body = (await request.json()) as UpdateUserInput;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  if (!isAdmin(session)) {
    if (body.role !== undefined || body.type !== undefined || body.status !== undefined) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Members cannot change role, type, or status." } },
        { status: 403 },
      );
    }
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    const problem = passwordProblem(body.password);
    if (problem) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: problem } },
        { status: 400 },
      );
    }
  }

  const current = await adapter.getUser(id);
  if (!current) return notFound(id);
  const nextEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailChanging = nextEmail !== "" && nextEmail !== current.email.toLowerCase();
  if (emailChanging) {
    if (!(await mailIsActive())) {
      return NextResponse.json(
        {
          error: {
            code: "MAIL_NOT_CONFIGURED",
            message: "Set up the system mailbox in Settings → E-Mail Delivery before changing an email address.",
          },
        },
        { status: 409 },
      );
    }
    delete body.email;
    const token = await issueAccountToken(id, "email_change", { email: nextEmail });
    const origin = await requestOrigin();
    const confirm = confirmEmailMessage({
      confirmUrl: `${origin}/login/confirm-email?token=${encodeURIComponent(token)}`,
      nextEmail,
    });
    try {
      await sendSystemMail({ to: nextEmail, ...confirm });
    } catch (err) {
      console.error("Email confirmation failed", err);
      return NextResponse.json(
        { error: { code: "MAIL_FAILED", message: "The confirmation email could not be sent. The address was not changed." } },
        { status: 502 },
      );
    }
    const notice = emailChangedNotice({ nextEmail });
    await sendSystemMail({ to: current.email, ...notice }).catch((err) => {
      console.error("Email change notice failed", err);
    });
  }

  try {
    const user = await adapter.updateUser(id, body);
    if (!user) return notFound(id);
    return NextResponse.json({ data: user, email_change_pending: emailChanging });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("VALIDATION:")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: msg.replace(/^VALIDATION:\s*/, "") } },
        { status: 400 },
      );
    }
    if (msg.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: msg.replace(/^CONFLICT:\s*/, "") } },
        { status: 409 },
      );
    }
    console.error("PATCH /api/users/[id]", e);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to update user." } },
      { status: 500 },
    );
  }
}
