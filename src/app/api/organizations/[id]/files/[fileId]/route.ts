import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { detachFile } from '@/lib/records/attach-files';

/**
 * DELETE /api/organizations/<id>/files/<file id> (1.0.23): take one file off an organization.
 * The stored file stays unless `?delete_file=1`.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> },
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
  const { id, fileId } = await context.params;
  const deleteFile = new URL(request.url).searchParams.get('delete_file') === '1';
  const result = await detachFile({ kind: 'organization', id }, fileId, deleteFile);
  if (!result.ok) {
    return NextResponse.json({ error: { code: result.code, message: result.message } }, { status: result.status });
  }
  return NextResponse.json({ data: result.saved, field: result.field, removed: result.files[0], file_deleted: deleteFile });
}
