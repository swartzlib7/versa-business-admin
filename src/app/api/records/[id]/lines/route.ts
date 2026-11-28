import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { adapter } from '@/lib/data/adapter';
import { getInstance, updateInstance } from '@/lib/fixtures/record-instances';
import { getRecordType } from '@/lib/fixtures/record-types';
import { foldRecordTypeApiName } from '@/lib/catalog/name-aliases';
import { afterRecordWrite, prepareRecordWrite } from '@/lib/records/pipeline';
import { RECORD_BODY_KEYS, recordTopLevelProblem } from '@/lib/records/known-fields';
import { defaultLineGroup, lineDataStrings } from '@/lib/records/line-group';
import { TASK_LINE_GROUP, taskLinesProblem } from '@/lib/records/project-task-lines';

/**
 * POST /api/records/<id>/lines (1.0.14): add lines to a header_lines record
 * without sending the whole lines array back. Body:
 *   { "data": { "trip_date": "2026-11-19", "trip_miles": 42 }, "line_group": "trips" }
 * or { "lines": [ { "data": {...} }, ... ] } for several at once.
 * line_group is optional (default: the type's lines group). Summary fields
 * and statistics fed by this type are updated. Statistics headers take their
 * values through /api/statistics/<id>/lines instead.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    );
  }
  if (!isAdmin(session)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin session required.' } },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } },
      { status: 400 },
    );
  }
  const current = adapter.getRecord ? await adapter.getRecord(id) : getInstance(id);
  if (!current) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: `Record '${id}' not found.` } }, { status: 404 });
  }
  const typeApiName = foldRecordTypeApiName(current.type_api_name);
  // 1.0.24: a line field sent beside "data" instead of inside it would be ignored.
  const misplaced = recordTopLevelProblem(typeApiName, body, RECORD_BODY_KEYS.addLines);
  if (misplaced) {
    return NextResponse.json({ error: { code: 'FIELD_OUTSIDE_DATA', message: misplaced } }, { status: 400 });
  }
  if (typeApiName === 'statistics') {
    return NextResponse.json(
      { error: { code: 'USE_CAPTURE_API', message: `Statistics values go through POST /api/statistics/${id}/lines.` } },
      { status: 400 },
    );
  }
  if (getRecordType(typeApiName)?.structure !== 'header_lines') {
    return NextResponse.json(
      { error: { code: 'NO_LINES', message: 'This record type has no lines ("Header and lines" types only).' } },
      { status: 400 },
    );
  }
  const requested = Array.isArray(body.lines) ? body.lines : [{ data: body.data, line_group: body.line_group }];
  const fallbackGroup = defaultLineGroup(typeApiName);
  const added: Array<{ line_group?: string; data: Record<string, string> }> = [];
  for (const raw of requested) {
    const row = (raw ?? {}) as { data?: unknown; line_group?: unknown };
    const data = lineDataStrings(row.data);
    if (!data || !Object.keys(data).length) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Each line needs a "data" object with at least one field.' } },
        { status: 400 },
      );
    }
    const group = typeof row.line_group === 'string' && row.line_group.trim() ? row.line_group.trim() : fallbackGroup;
    added.push({ ...(group ? { line_group: group } : {}), data });
  }
  const existing = (current.lines ?? []).map((line) => ({
    id: line.id,
    line_group: line.line_group,
    data: line.data ?? {},
  }));
  const lines: Array<{ id?: string; line_group?: string; data: Record<string, string> }> = [...existing, ...added];
  if (typeApiName === 'executive_project') {
    const problem = taskLinesProblem(
      lines
        .filter((line) => (line.line_group ?? TASK_LINE_GROUP) === TASK_LINE_GROUP)
        .map((line) => ({ id: line.id ?? '', data: line.data })),
    );
    if (problem) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: problem } }, { status: 400 });
    }
  }
  const prepared = await prepareRecordWrite({
    typeApiName,
    data: {
      ...(current.data ?? {}),
      ...(session?.userId ? { last_modified_by: String(session.userId) } : {}),
      updated_at: new Date().toISOString(),
    },
    lines,
    current,
  });
  if (!prepared.ok) {
    return NextResponse.json({ error: { code: prepared.code, message: prepared.message } }, { status: 400 });
  }
  const data = prepared.data;
  const savedLines = prepared.lines ?? lines;
  const result = adapter.updateRecord
    ? await adapter.updateRecord(id, { data, lines: savedLines })
    : updateInstance(id, { data, lines: savedLines });
  if (!result.ok) {
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: 400 });
  }
  const before = new Set(existing.map((line) => line.id));
  const newLines = (result.instance.lines ?? []).filter((line) => !before.has(line.id));
  await afterRecordWrite(result.instance, current);
  return NextResponse.json({ data: result.instance, lines: newLines }, { status: 201 });
}
