-- #244 Slice F (D1 cutover): retire vendor_integration record type.
-- Vendor integrations become organization-attached record_line rows
-- (record_line.organization_id + line_group='integrations'); the E1 XOR
-- CHECK record_line_parent_check guarantees exactly one parent per row.
-- Existing vendor_integration records migrate: each becomes one org-attached
-- line on the record's owning organization (record.org_id), carrying the
-- record's field values in line.data. The retired record rows are removed
-- (record_type row is deleted; record rows cascade).

--> statement-breakpoint
INSERT INTO "record_line" ("organization_id", "line_group", "position", "data")
SELECT
  r."org_id",
  'integrations',
  0,
  jsonb_build_object(
    'name', COALESCE(r."header"->>'name', r."header"->>'Name', ''),
    'kind', COALESCE(r."header"->>'kind', ''),
    'status', COALESCE(r."header"->>'status', ''),
    'notes', COALESCE(r."header"->>'notes', '')
  )
FROM "record" r
JOIN "record_type" rt ON rt."id" = r."record_type_id"
WHERE rt."api_name" = 'vendor_integration';

--> statement-breakpoint
DELETE FROM "record_type" WHERE "record_type"."api_name" = 'vendor_integration';
