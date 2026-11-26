import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { attachFiles } from '@/lib/records/attach-files';

/**
 * POST /api/records/<id>/files (1.0.23): upload files and attach them to the record in one
 * call. Multipart: one or more `file` parts, and `field` (the Attachments field's API name)
 * when the type has more than one. Adds to what the record already has (up to 10); nothing
 * is stored if any file is refused. Answers the record and the new entries.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_FORM', message: 'Send multipart/form-data with one or more "file" parts.' } },
      { status: 400 },
    );
  }
  const files = form.getAll('file').filter((part): part is File => part instanceof File);
  const field = form.get('field');
  const { id } = await context.params;
  const result = await attachFiles({ kind: 'record', id, userId: session?.userId }, files, typeof field === 'string' ? field : null);
  if (!result.ok) {
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  }
  return NextResponse.json({ data: result.saved, field: result.field, files: result.files }, { status: 201 });
}
