export type EmailDeliverySettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  mailbox: string;
};

export const EMPTY_EMAIL_DELIVERY: EmailDeliverySettings = {
  enabled: false,
  host: "",
  port: 993,
  secure: true,
  username: "",
  password: "",
  mailbox: "INBOX",
};

export function normalizeEmailDelivery(raw: unknown): EmailDeliverySettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const port = Number(row.port);
  return {
    enabled: row.enabled === true,
    host: typeof row.host === "string" ? row.host.trim() : "",
    port: Number.isFinite(port) && port > 0 ? Math.round(port) : 993,
    secure: row.secure !== false,
    username: typeof row.username === "string" ? row.username.trim() : "",
    password: typeof row.password === "string" ? row.password : "",
    mailbox: typeof row.mailbox === "string" && row.mailbox.trim() ? row.mailbox.trim() : "INBOX",
  };
}

/** What Settings may show. The mailbox password stays on the server. */
export function publicEmailDelivery(settings: EmailDeliverySettings) {
  return {
    enabled: settings.enabled,
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    username: settings.username,
    mailbox: settings.mailbox,
    password_set: Boolean(settings.password),
  };
}
