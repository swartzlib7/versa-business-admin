/** Organization catalog field checks (name + jsonb extras). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTP_RE = /^https?:\/\/[^\s]+$/i;
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|svg\+xml|gif);base64,/i;

function asText(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return /^[+]?[\d\s().-]{7,22}$/.test(value.trim());
}

export function isValidOrgLogo(value: string): boolean {
  return HTTP_RE.test(value) || DATA_IMAGE_RE.test(value);
}

export function isValidSlug(value: string): boolean {
  return SLUG_RE.test(value);
}

/** Human error or null. Used by the listing form. */
export function organizationFieldError(draft: Record<string, string>): string | null {
  if (!(draft.name ?? "").trim()) return "Name is required.";
  const email = (draft.email ?? "").trim();
  if (email && !isValidEmail(email)) return "Email is not a valid email address.";
  const phone = (draft.phone ?? "").trim();
  if (phone && !isValidPhone(phone)) return "Phone must be 7–15 digits (spaces, +, parentheses, and dashes allowed).";
  const slug = (draft.slug ?? "").trim();
  if (slug && !isValidSlug(slug)) return "Slug must be lowercase letters, numbers, and hyphens.";
  const logo = (draft.logo_url ?? "").trim();
  if (logo && !isValidOrgLogo(logo)) return "Logo must be an uploaded image or an http(s) image URL.";
  return null;
}

/** Adapter / API — throws VALIDATION: … */
export function assertOrganizationFields(input: {
  name?: string;
  data?: Record<string, unknown>;
}): void {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("VALIDATION: name cannot be empty");
  }
  const data = input.data ?? {};
  const email = asText(data.email);
  if (email && !isValidEmail(email)) {
    throw new Error("VALIDATION: Email is not a valid email address.");
  }
  const phone = asText(data.phone);
  if (phone && !isValidPhone(phone)) {
    throw new Error("VALIDATION: Phone must be 7–15 digits.");
  }
  const slug = asText(data.slug);
  if (slug && !isValidSlug(slug)) {
    throw new Error("VALIDATION: Slug must be lowercase letters, numbers, and hyphens.");
  }
  const logo = asText(data.logo_url);
  if (logo && !isValidOrgLogo(logo)) {
    throw new Error("VALIDATION: Logo must be an uploaded image or an http(s) image URL.");
  }
}

/** Merge extras: empty string / null removes the key so staff can clear a field. */
export function mergeOrganizationData(
  current: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...(current ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === "" || value === null || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next;
}
