/**
 * D1 — tenant-defined catalog identifiers use the `c_` prefix.
 * System / product-owned api names stay unprefixed.
 * Schema is still being locked; there are no unprefixed customs until operators create some.
 * New custom fields and record types must use c_ (e.g. c_priority, c_due_date).
 */

export const CUSTOM_API_PREFIX = "c_";

const CUSTOM_API = /^c_[a-z][a-z0-9_]*$/;

/** Lowercase a-z / 0-9 / underscore, always prefixed with c_. Other characters are dropped as the user types. */
export function normalizeCustomApiName(raw: string): string {
  let body = raw.toLowerCase();
  if (body.startsWith(CUSTOM_API_PREFIX)) body = body.slice(CUSTOM_API_PREFIX.length);
  body = body.replace(/[^a-z0-9_]/g, "").replace(/^[^a-z]+/, "");
  return body ? CUSTOM_API_PREFIX + body : "";
}

export function customApiBody(apiName: string): string {
  const normalized = normalizeCustomApiName(apiName);
  return normalized.startsWith(CUSTOM_API_PREFIX)
    ? normalized.slice(CUSTOM_API_PREFIX.length)
    : normalized;
}

export function validateTenantApiName(
  apiName: string,
): { ok: true } | { ok: false; code: string; message: string } {
  if (!CUSTOM_API.test(apiName)) {
    return {
      ok: false,
      code: "INVALID_API_NAME",
      message:
        "Custom api_name must be c_ plus lowercase letters, digits, and underscores (e.g. c_due_date).",
    };
  }
  if (apiName.startsWith("system_") || apiName === "id") {
    return {
      ok: false,
      code: "RESERVED_API_NAME",
      message: "That api_name is reserved.",
    };
  }
  return { ok: true };
}
