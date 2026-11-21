/**
 * Lookup field targets (1.0.14). A lookup's `lookup_object_api_name` is either
 * a record type (any system or custom type) or one of the built-in objects
 * below, which have their own pickers. Record-type targets get the record
 * picker on forms and show the record's name in tables.
 */
const NON_RECORD_TARGETS = new Set(["user", "organization", "record_type", "render_driver", "record"]);

export function isRecordTypeLookup(target: string | null | undefined): target is string {
  return !!target && !NON_RECORD_TARGETS.has(target);
}
