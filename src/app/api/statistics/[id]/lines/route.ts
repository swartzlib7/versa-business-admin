import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import type { Session } from '@/lib/data';
import { requireToken } from '@/lib/integrations/token-auth';
import {
  captureStatLineDb,
  deleteStatLineDb,
  listStatLinesDb,
  loadStatHeaderConfig,
  updateStatLineDb,
} from '@/lib/db/stat-lines-store';

/**
 * I5.6.35 S-4 (2026-09-12) - Statistics capture API (locked contract,
 * state_statistics_environment.md): every statistic header exposes a REST
 * endpoint for posting lines so monitoring scripts can feed statistics. The
 * endpoint and the UI form share ONE validation layer
 * (src/lib/statistics/model.ts): scale bounds, frequency window, series
 * capacity.
 *
 * Auth: session cookie (UI) OR an access token (scripts, 1.0.20). The token's
 * Integration must list `statistics`, and the statistic must pass that line's
 * filter. HTTP Basic (email and password) was removed in 1.0.20: it skipped the
 * sign-in proof-of-work, so it allowed password guessing. Example:
 *   curl -X POST .../api/statistics/<header_id>/lines \
 *     -H 'Authorization: Bearer vba_…' -H 'Content-Type: application/json' \
 *     -d '{"slot": 0, "value": 42, "source": "script"}'
 */

type Auth = { ok: true; session: Session } | { ok: false; response: NextResponse };

async function resolveSession(request: Request, headerId: string): Promise<Auth> {
  const session = getSessionFromRequest(request);
  if (isAuthenticated(session)) return { ok: true, session: session as Session };
  const auth = request.headers.get('authorization') ?? '';
  if (/^basic\s/i.test(auth)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: {
            code: 'BASIC_REMOVED',
            message: 'HTTP Basic sign-in was removed in 1.0.20. Use an access token: Authorization: Bearer vba_… (Ops Manual 5.2.17).',
          },
        },
        { status: 401 },
      ),
    };
  }
  const { adapter } = await import('@/lib/data/adapter');
  const record = adapter.getRecord ? await adapter.getRecord(headerId).catch(() => null) : null;
  const check = await requireToken(request, { recordType: 'statistics', record: record?.type_api_name === 'statistics' ? record : null });
  if (!check.ok) return check;
  if (!record || record.type_api_name !== 'statistics') {
    return { ok: false, response: NextResponse.json({ error: { code: 'HEADER_NOT_FOUND', message: 'Statistic not found.' } }, { status: 404 }) };
  }
  return { ok: true, session: check.grant.session };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await resolveSession(request, id);
  if (!auth.ok) return auth.response;
  const header = await loadStatHeaderConfig(id);
  if (!header.ok) {
    return NextResponse.json(
      { error: { code: header.code, message: header.message } },
      { status: header.code === 'HEADER_NOT_FOUND' ? 404 : 422 },
    );
  }
  const { searchParams } = new URL(request.url);
  const seriesParam = searchParams.get('series');
  const series = seriesParam === null ? undefined : Number(seriesParam);
  const lines = await listStatLinesDb(id, Number.isInteger(series) ? (series as number) : undefined);
  return NextResponse.json({ data: lines, count: lines.length, config: header.config });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await resolveSession(request, id);
  if (!auth.ok) return auth.response;

  let body: { series?: number; slot?: number; value?: number; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    );
  }

  const slot = Number(body.slot);
  const value = Number(body.value);
  if (!Number.isInteger(slot) || !Number.isFinite(value)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'slot (integer) and value (number) are required.' } },
      { status: 400 },
    );
  }

  const result = await captureStatLineDb({
    headerId: id,
    series: body.series === undefined ? undefined : Number(body.series),
    slot,
    value,
    source: typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 40) : 'api',
  });
  if (!result.ok) {
    const status = result.code === 'HEADER_NOT_FOUND' ? 404
      : result.code === 'SLOT_TAKEN' ? 409
      : 422;
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status });
  }
  return NextResponse.json({ data: result.line }, { status: 201 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await resolveSession(request, id);
  if (!auth.ok) return auth.response;

  let body: { lineId?: string; series?: number; slot?: number; value?: number | string | null; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    );
  }
  const lineId = typeof body.lineId === 'string' ? body.lineId.trim() : '';
  if (!lineId) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'lineId is required.' } },
      { status: 400 },
    );
  }
  const slot = body.slot === undefined ? undefined : Number(body.slot);
  let value: number | null | undefined = undefined;
  if (body.value === null) value = null;
  else if (typeof body.value === 'string' && !(body.value as string).trim()) value = null;
  else if (body.value !== undefined) value = Number(body.value);

  const result = await updateStatLineDb({
    headerId: id,
    lineId,
    slot: slot !== undefined && Number.isInteger(slot) ? slot : undefined,
    value,
    source: typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 40) : 'ui',
  });
  if (!result.ok) {
    const status = result.code === 'HEADER_NOT_FOUND' || result.code === 'LINE_NOT_FOUND' ? 404
      : result.code === 'SLOT_TAKEN' ? 409
      : 422;
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status });
  }
  return NextResponse.json({ data: result.line });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await resolveSession(request, id);
  if (!auth.ok) return auth.response;
  const header = await loadStatHeaderConfig(id);
  if (!header.ok) {
    return NextResponse.json(
      { error: { code: header.code, message: header.message } },
      { status: header.code === 'HEADER_NOT_FOUND' ? 404 : 422 },
    );
  }
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get('lineId');
  if (!lineId) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'lineId query parameter is required.' } },
      { status: 400 },
    );
  }
  const deleted = await deleteStatLineDb(lineId);
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'LINE_NOT_FOUND', message: 'Line not found for this operation.' } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: { deleted: true } });
}
