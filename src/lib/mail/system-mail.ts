/**
 * System mailbox. Active when Settings points at a Credential whose SMTP block is on.
 * Design: docs/production/state/state_account_mail.md
 */
import nodemailer from "nodemailer";
import { adapter } from "@/lib/data/adapter";
import { getSiteSettingsFixture } from "@/lib/fixtures/site-settings";

type SmtpBlock = {
  enabled?: boolean;
  host?: string;
  port?: number;
  encryption?: string;
};

type Mailbox = {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function readConfig(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

export async function loadSystemMailbox(): Promise<Mailbox | null> {
  const credentialId = getSiteSettingsFixture().email_delivery?.credential_id?.trim() ?? "";
  if (!credentialId || !adapter.getRecord) return null;
  const row = await adapter.getRecord(credentialId).catch(() => null);
  const config = readConfig(row?.data?.configuration);
  if (!config) return null;
  const smtp = (config.smtp ?? {}) as SmtpBlock;
  const host = String(smtp.host ?? "").trim();
  if (smtp.enabled !== true || !host) return null;
  const auth = (config.auth ?? {}) as { username?: string; password?: string };
  const address = String(config.email_address ?? auth.username ?? "").trim();
  if (!address || !auth.password) return null;
  const name = String(config.display_name ?? "").trim();
  const encryption = String(smtp.encryption ?? "starttls").toLowerCase();
  return {
    from: name ? `"${name.replace(/"/g, "")}" <${address}>` : address,
    host,
    port: Number(smtp.port) || (encryption === "ssl" ? 465 : 587),
    secure: encryption === "ssl",
    user: String(auth.username ?? address),
    password: String(auth.password),
  };
}

export async function mailIsActive(): Promise<boolean> {
  return (await loadSystemMailbox()) !== null;
}

export async function sendSystemMail(message: OutboundMail): Promise<void> {
  const mailbox = await loadSystemMailbox();
  if (!mailbox) throw new Error("MAIL_NOT_CONFIGURED");
  const transport = nodemailer.createTransport({
    host: mailbox.host,
    port: mailbox.port,
    secure: mailbox.secure,
    auth: { user: mailbox.user, pass: mailbox.password },
    requireTLS: !mailbox.secure && mailbox.port === 587,
  });
  await transport.sendMail({
    from: mailbox.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
