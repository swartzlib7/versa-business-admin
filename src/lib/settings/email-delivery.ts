export type EmailDeliverySettings = {
  credential_id: string;
};

export const EMPTY_EMAIL_DELIVERY: EmailDeliverySettings = {
  credential_id: "",
};

export function normalizeEmailDelivery(raw: unknown): EmailDeliverySettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    credential_id: typeof row.credential_id === "string" ? row.credential_id.trim() : "",
  };
}

/** Settings shows the credential lookup. The mailbox configuration stays on the record. */
export function publicEmailDelivery(settings: EmailDeliverySettings) {
  return {
    credential_id: settings.credential_id,
  };
}
