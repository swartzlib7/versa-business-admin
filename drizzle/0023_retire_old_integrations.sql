-- 1.0.20 (state_integrations.md §3.7): one Integrations feature, the vendor_integration
-- record type. Rows of the old `integrations` table and the old vendor organization
-- lines (line_group 'integrations') become Integration records with status Standby,
-- then the table and those lines are removed. Nothing with data is dropped uncopied.
--> statement-breakpoint
DO $$
DECLARE
  integration_type text;
  primary_org text;
  table_rows integer := 0;
  org_lines integer := 0;
BEGIN
  SELECT id INTO integration_type FROM record_type WHERE api_name = 'vendor_integration' LIMIT 1;
  SELECT id INTO primary_org FROM organizations
    WHERE (data->>'is_primary') = 'true' OR org_type = 'internal'
    ORDER BY (data->>'is_primary') = 'true' DESC
    LIMIT 1;
  IF to_regclass('public.integrations') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM integrations' INTO table_rows;
  END IF;
  SELECT count(*) INTO org_lines FROM record_line
    WHERE organization_id IS NOT NULL AND line_group = 'integrations';

  IF (table_rows > 0 OR org_lines > 0) AND (integration_type IS NULL OR primary_org IS NULL) THEN
    RAISE EXCEPTION 'Migration 0023: old integrations were found, but this database has no Integration record type or Primary organization yet. Start the previous release once, then run npm run db:migrate again.';
  END IF;

  IF table_rows > 0 THEN
    EXECUTE format($q$
      INSERT INTO record (id, org_id, record_type_id, header)
      SELECT gen_random_uuid()::text, %L, %L, jsonb_build_object(
        'name', i.name,
        'status', 'standby',
        'kind', CASE WHEN i.type = 'api' THEN 'api' ELSE 'other' END,
        'direction', 'send',
        'mode', 'push',
        'notes', trim(concat('Moved from the old Integrations table (type ', i.type, ', status ', i.status, '). ', coalesce(i.description, '')))
      )
      FROM integrations i
    $q$, primary_org, integration_type);
  END IF;

  IF org_lines > 0 THEN
    INSERT INTO record (id, org_id, record_type_id, header)
    SELECT gen_random_uuid()::text, primary_org, integration_type, jsonb_build_object(
      'name', coalesce(nullif(rl.data->>'name', ''), 'Integration'),
      'status', 'standby',
      'kind', CASE WHEN rl.data->>'kind' IN ('api', 'webhook', 'sftp', 'manual', 'other', 'accounting') THEN rl.data->>'kind' ELSE 'other' END,
      'organization_id', rl.organization_id,
      'direction', 'send',
      'mode', 'push',
      'notes', trim(concat('Moved from the vendor''s integration lines. ', coalesce(rl.data->>'notes', '')))
    )
    FROM record_line rl
    WHERE rl.organization_id IS NOT NULL AND rl.line_group = 'integrations';
    DELETE FROM record_line WHERE organization_id IS NOT NULL AND line_group = 'integrations';
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "integrations";
