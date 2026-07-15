import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// ---------------------------------------------------------------------------
// Standard error shape — documented in API_CONTRACT.md
// ---------------------------------------------------------------------------
function notFound(id: string) {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `Agent '${id}' was not found.`,
      },
    },
    { status: 404 },
  );
}

// ---------------------------------------------------------------------------
// GET /api/agents/[id] — single agent detail
// ---------------------------------------------------------------------------
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agent = await adapter.getAgent(id);

  if (!agent) {
    return notFound(id);
  }

  return NextResponse.json({ data: agent });
}

// ---------------------------------------------------------------------------
// PATCH /api/agents/[id] — experimental status mutation
// Accepts { status: active | idle | error | offline }
// Mutates the in-memory fixture store for the process lifetime.
// ---------------------------------------------------------------------------
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!adapter.updateAgentStatus) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Agent status mutation is not supported by the current data adapter.',
        },
      },
      { status: 501 },
    );
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Request body must be valid JSON.',
        },
      },
      { status: 400 },
    );
  }

  const validStatuses = ['active', 'idle', 'error', 'offline'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: `status must be one of: ${validStatuses.join(', ')}.`,
        },
      },
      { status: 400 },
    );
  }

  const updated = await adapter.updateAgentStatus(
    id,
    body.status as 'active' | 'idle' | 'error' | 'offline',
  );

  if (!updated) {
    return notFound(id);
  }

  return NextResponse.json({ data: updated });
}
