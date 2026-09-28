import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";

export type MailMessage = { subject: string; text: string; html: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandBits() {
  const site = getSiteSettingsFixture();
  const name = site.brand_name?.trim() || "Versa - Business Admin";
  const color = site.brand_color?.trim() || "#05ada2";
  const logo = site.brand_logo_url?.trim() ?? "";
  const logoHtml = /^https?:\/\//i.test(logo)
    ? `<img src="${logo}" alt="" width="48" height="48" style="display:block;border:0;margin:0 auto 12px;" />`
    : "";
  return { name, color, logoHtml };
}

function shell(title: string, bodyHtml: string, bodyText: string): MailMessage {
  const { name, color, logoHtml } = brandBits();
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;">
        <tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;text-align:center;">
          ${logoHtml}
          <div style="font-size:18px;color:${color};font-weight:700;">${name}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#18181b;">
          <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
          ${bodyHtml}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject: title, text: `${name}\n\n${bodyText}`, html };
}

function button(href: string, label: string): string {
  const { color } = brandBits();
  return `<p style="margin:20px 0;"><a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">${label}</a></p>`;
}

export function welcomeMessage(input: { to: string; password: string; loginUrl: string }): MailMessage {
  const { name } = brandBits();
  const message = shell(
    `Your ${name} account`,
    `     <p>An account was created for ${escapeHtml(input.to)}.</p>
     <p>Temporary password:</p>
     <p style="font-family:Consolas,monospace;font-size:16px;background:#f4f4f5;padding:12px;border-radius:6px;">${escapeHtml(input.password)}</p>
     <p>Sign in and choose a new password.</p>
     ${button(input.loginUrl, "Sign in")}`,
    `An account was created for ${input.to}.\nTemporary password: ${input.password}\nSign in and choose a new password.\n${input.loginUrl}`,
  );
  message.subject = `Your ${name} account`;
  return message;
}

export function resetMessage(input: { resetUrl: string }): MailMessage {
  const { name } = brandBits();
  const message = shell(
    `Reset your ${name} password`,
    `<p>A password reset was requested. This link works once and expires in 60 minutes.</p>
     ${button(input.resetUrl, "Reset password")}
     <p style="font-size:13px;color:#52525b;">If you did not ask for this, you can ignore this message.</p>`,
    `A password reset was requested. This link works once and expires in 60 minutes.\n${input.resetUrl}\nIf you did not ask for this, you can ignore this message.`,
  );
  message.subject = `Reset your ${name} password`;
  return message;
}

export function confirmEmailMessage(input: { confirmUrl: string; nextEmail: string }): MailMessage {
  const { name } = brandBits();
  const message = shell(
    `Confirm your ${name} email`,
    `<p>Confirm ${escapeHtml(input.nextEmail)} as the address on your account. This link works once and expires in 24 hours.</p>
     ${button(input.confirmUrl, "Confirm email")}`,
    `Confirm ${input.nextEmail} as the address on your account. This link works once and expires in 24 hours.\n${input.confirmUrl}`,
  );
  message.subject = `Confirm your ${name} email`;
  return message;
}

export function emailChangedNotice(input: { nextEmail: string }): MailMessage {
  const { name } = brandBits();
  const message = shell(
    `Your ${name} email is changing`,
    `<p>A request was made to change this account's email to ${escapeHtml(input.nextEmail)}. The change is not finished until that address confirms it.</p>
     <p style="font-size:13px;color:#52525b;">If you did not ask for this, sign in and contact an administrator.</p>`,
    `A request was made to change this account's email to ${input.nextEmail}. The change is not finished until that address confirms it.`,
  );
  message.subject = `Your ${name} email is changing`;
  return message;
}
