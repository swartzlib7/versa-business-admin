import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from '@/lib/auth';
import { refreshStatisticFromSource } from '@/lib/statistics/record-source';

/**
 * POST /api/statistics/<header_id>/refresh (1.0.14): recompute a statistic
 * that is fed from records. It also recomputes on its own whenever a source
 * record changes through the records API; this is for scripts and repairs.
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
  const { id } = await context.params;
  const result = await refreshStatisticFromSource(id);
  if (!result) {
    return NextResponse.json(
      { error: { code: 'NO_SOURCE', message: 'This statistic is not fed from records (set Source record type and Date field).' } },
      { status: 400 },
    );
  }
  return NextResponse.json({ data: result });
}
