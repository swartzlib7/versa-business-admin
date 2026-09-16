/** Platform audit / stamp fields. The session (or the row) stamps these; the operator does not pick them. */
export {
  AUDIT_USER_APIS as AUDIT_FIELD_APIS,
  isPlatformStampField as isAuditField,
  PLATFORM_DEFAULT_FIELDS,
  PLATFORM_STAMP_APIS,
} from "@/lib/catalog/platform-fields";
