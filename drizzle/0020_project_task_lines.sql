-- Project task lines (2026-10-14).
-- Move milestones, executive_task records, their subtask lines, and leftover
-- rows in the old tasks table onto executive_project lines (group "tasks").
-- A migrated Task record keeps its id as the line id.
-- Then remove the old Task record type and the tasks table.
-- One transaction. The count check rolls the migration back when the numbers differ.

--> statement-breakpoint
DO $$
DECLARE
  expected integer;
  actual integer;
  unassigned_id text := 'project-unassigned-tasks';
  project_type text;
  org_id text;
  existing_lines integer;
BEGIN
  SELECT rt.id INTO project_type FROM record_type rt WHERE rt.api_name = 'executive_project' LIMIT 1;

  -- Old tasks rows point at the old projects table. Copy each referenced
  -- project that is not a record yet, with the same id, so its tasks land on it.
  IF project_type IS NOT NULL THEN
    INSERT INTO record (id, org_id, record_type_id, header)
    SELECT
      p.id,
      p.organization_id,
      project_type,
      jsonb_build_object(
        'name', p.name,
        'status', p.status,
        'description', COALESCE(p.description, ''),
        'priority', p.priority,
        'owner_id', COALESCE(p.owner_user_id, ''),
        'start_date', COALESCE(p.start_date::text, ''),
        'target_date', COALESCE(p.target_date::text, '')
      )
    FROM projects p
    WHERE NOT EXISTS (SELECT 1 FROM record r WHERE r.id = p.id)
      AND EXISTS (
        SELECT 1 FROM tasks t
        WHERE t.project_id = p.id
          AND NOT EXISTS (SELECT 1 FROM record r WHERE r.id = t.id)
      );
  END IF;

  SELECT count(*) INTO existing_lines
  FROM record_line rl
  JOIN record r ON r.id = rl.record_id
  JOIN record_type rt ON rt.id = r.record_type_id
  WHERE rt.api_name = 'executive_project' AND rl.line_group = 'tasks';

  SELECT count(*) INTO expected FROM (
    SELECT rl.id
    FROM record_line rl
    JOIN record r ON r.id = rl.record_id
    JOIN record_type rt ON rt.id = r.record_type_id
    WHERE rt.api_name = 'executive_project' AND rl.line_group = 'milestones'
    UNION ALL
    SELECT r.id
    FROM record r
    JOIN record_type rt ON rt.id = r.record_type_id
    WHERE rt.api_name = 'executive_task'
    UNION ALL
    SELECT rl.id
    FROM record_line rl
    JOIN record r ON r.id = rl.record_id
    JOIN record_type rt ON rt.id = r.record_type_id
    WHERE rt.api_name = 'executive_task'
    UNION ALL
    SELECT t.id
    FROM tasks t
    WHERE NOT EXISTS (SELECT 1 FROM record r WHERE r.id = t.id)
  ) src;

  UPDATE record_line rl
  SET line_group = 'tasks',
      data = jsonb_build_object(
        'task_title', COALESCE(rl.data->>'milestone_title', ''),
        'task_due_date', COALESCE(rl.data->>'milestone_date', ''),
        'task_status', 'todo',
        'task_percent', '',
        'task_parent_id', '',
        'task_assignee_id', '',
        'task_notes', ''
      )
  FROM record r
  JOIN record_type rt ON rt.id = r.record_type_id
  WHERE rl.record_id = r.id
    AND rt.api_name = 'executive_project'
    AND rl.line_group = 'milestones';

  IF expected > 0 AND EXISTS (
    SELECT 1 FROM record r
    JOIN record_type rt ON rt.id = r.record_type_id
    WHERE rt.api_name = 'executive_task'
      AND (
        COALESCE(r.header->>'project_id', '') = ''
        OR NOT EXISTS (
          SELECT 1 FROM record p
          JOIN record_type pt ON pt.id = p.record_type_id
          WHERE pt.api_name = 'executive_project' AND p.id = r.header->>'project_id'
        )
      )
  ) OR EXISTS (
    SELECT 1 FROM tasks t
    WHERE NOT EXISTS (SELECT 1 FROM record r WHERE r.id = t.id)
      AND (
        t.project_id IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM record p
          JOIN record_type pt ON pt.id = p.record_type_id
          WHERE pt.api_name = 'executive_project' AND p.id = t.project_id
        )
      )
  ) THEN
    SELECT id INTO org_id FROM organizations ORDER BY created_at NULLS LAST LIMIT 1;
    IF project_type IS NOT NULL AND org_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM record WHERE id = unassigned_id
    ) THEN
      INSERT INTO record (id, org_id, record_type_id, header)
      VALUES (
        unassigned_id,
        org_id,
        project_type,
        jsonb_build_object('name', 'Unassigned tasks', 'status', 'active')
      );
    END IF;
  END IF;

  INSERT INTO record_line (id, record_id, line_group, position, data)
  SELECT
    r.id,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM record p
        JOIN record_type pt ON pt.id = p.record_type_id
        WHERE pt.api_name = 'executive_project' AND p.id = r.header->>'project_id'
      ) THEN r.header->>'project_id'
      ELSE unassigned_id
    END,
    'tasks',
    100000 + ROW_NUMBER() OVER (
      ORDER BY COALESCE(NULLIF(r.header->>'due_date', ''), '9999-12-31'), r.created_at
    ) * 1000,
    jsonb_build_object(
      'task_title', COALESCE(r.header->>'name', ''),
      'task_assignee_id', COALESCE(NULLIF(r.header->>'assignee_id', ''), r.header->>'assignee_user_id', ''),
      'task_due_date', COALESCE(r.header->>'due_date', ''),
      'task_notes', COALESCE(r.header->>'notes', ''),
      'task_parent_id', '',
      'task_percent', CASE WHEN COALESCE(r.header->>'status', '') = 'done' THEN '100' ELSE '' END,
      'task_status', CASE COALESCE(r.header->>'status', '')
        WHEN 'planned' THEN 'todo'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'waiting' THEN 'waiting'
        WHEN 'blocked' THEN 'blocked'
        WHEN 'done' THEN 'done'
        ELSE 'todo'
      END
    )
  FROM record r
  JOIN record_type rt ON rt.id = r.record_type_id
  WHERE rt.api_name = 'executive_task';

  INSERT INTO record_line (record_id, line_group, position, data)
  SELECT
    parent.record_id,
    'tasks',
    parent.position + 1 + ROW_NUMBER() OVER (PARTITION BY rl.record_id ORDER BY rl.position),
    jsonb_build_object(
      'task_title', COALESCE(rl.data->>'subtask_title', ''),
      'task_parent_id', rl.record_id,
      'task_status', CASE WHEN COALESCE(rl.data->>'subtask_done', '') IN ('true', '1') THEN 'done' ELSE 'todo' END,
      'task_percent', CASE WHEN COALESCE(rl.data->>'subtask_done', '') IN ('true', '1') THEN '100' ELSE '' END,
      'task_due_date', '',
      'task_assignee_id', '',
      'task_notes', ''
    )
  FROM record_line rl
  JOIN record r ON r.id = rl.record_id
  JOIN record_type rt ON rt.id = r.record_type_id
  JOIN record_line parent ON parent.id = rl.record_id
  WHERE rt.api_name = 'executive_task';

  INSERT INTO record_line (id, record_id, line_group, position, data)
  SELECT
    t.id,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM record p
        JOIN record_type pt ON pt.id = p.record_type_id
        WHERE pt.api_name = 'executive_project' AND p.id = t.project_id
      ) THEN t.project_id
      ELSE unassigned_id
    END,
    'tasks',
    1000000000 + ROW_NUMBER() OVER (ORDER BY COALESCE(t.due_date, '9999-12-31'::date), t.created_at) * 1000,
    jsonb_build_object(
      'task_title', COALESCE(t.title, ''),
      'task_notes', COALESCE(t.description, ''),
      'task_assignee_id', COALESCE(t.assignee_user_id, ''),
      'task_due_date', COALESCE(t.due_date::text, ''),
      'task_parent_id', '',
      'task_percent', CASE WHEN t.status = 'done' THEN '100' ELSE '' END,
      'task_status', CASE t.status
        WHEN 'planned' THEN 'todo'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'waiting' THEN 'waiting'
        WHEN 'blocked' THEN 'blocked'
        WHEN 'done' THEN 'done'
        ELSE 'todo'
      END
    )
  FROM tasks t
  WHERE NOT EXISTS (SELECT 1 FROM record r WHERE r.id = t.id);

  SELECT count(*) INTO actual
  FROM record_line rl
  JOIN record r ON r.id = rl.record_id
  JOIN record_type rt ON rt.id = r.record_type_id
  WHERE rt.api_name = 'executive_project' AND rl.line_group = 'tasks'
;

  IF actual - existing_lines <> expected THEN
    RAISE EXCEPTION 'project task line migration made % lines, expected %', actual - existing_lines, expected;
  END IF;

  -- record.record_type_id has no cascade; remove the old Task records first.
  -- Their subtask lines and relations cascade with them.
  DELETE FROM record r
  USING record_type rt
  WHERE rt.id = r.record_type_id AND rt.api_name = 'executive_task';
  DELETE FROM record_type WHERE api_name = 'executive_task';
  DROP TABLE IF EXISTS tasks;

  UPDATE catalog_overlay
  SET body = jsonb_set(
    jsonb_set(
      body,
      '{fields}',
      COALESCE((
        SELECT jsonb_agg(f)
        FROM jsonb_array_elements(COALESCE(body->'fields', '[]'::jsonb)) f
        WHERE f->>'object_api_name' IS DISTINCT FROM 'executive_task'
      ), '[]'::jsonb)
    ),
    '{recordTypes}',
    COALESCE((
      SELECT jsonb_agg(t)
      FROM jsonb_array_elements(COALESCE(body->'recordTypes', '[]'::jsonb)) t
      WHERE t->>'api_name' IS DISTINCT FROM 'executive_task'
    ), '[]'::jsonb)
  )
  WHERE body IS NOT NULL;
END $$;
