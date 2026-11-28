import '@/lib/catalog/install-durable';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, isAdmin, isAuthenticated } from '@/lib/auth';
import { printRecord, savePrintToDocuments } from '@/lib/print/print-record';

/**
 * GET /api/records/<id>/print?template=<template id>&download=1 (1.0.27): the record as a PDF,
 * with that print template or the first that fits (Use when). `download=1` asks the browser to
 * save it instead of showing it.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  const { id } = await context.params;
  const url = new URL(request.url);
  const printed = await printRecord(id, url.searchParams.get('template'));
  if (!printed.ok) {
    return NextResponse.json({ error: { code: printed.code, message: printed.message } }, { status: printed.status });
  }
  const download = url.searchParams.get('download') === '1';
  const ascii = printed.filename.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, "'");
  return new Response(new Uint8Array(printed.pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(printed.filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Print-Template': printed.template.id,
      'X-Print-Pages': String(printed.pages),
    },
  });
}

/**
 * POST /api/records/<id>/print { "template"?: <template id> } (1.0.27): print and keep the PDF in
 * the record's Documents & Photos. Answers the stored file.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(request);
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin session required.' } }, { status: 403 });
  }
  const { id } = await context.params;
  let body: { template?: unknown } = {};
  try {
    const raw = await request.text();
    body = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Request body must be JSON.' } }, { status: 400 });
  }
  const template = typeof body.template === 'string' && body.template.trim() ? body.template.trim() : null;
  const saved = await savePrintToDocuments(id, template, session?.userId ? String(session.userId) : null);
  if (!saved.ok) {
    return NextResponse.json({ error: { code: saved.code, message: saved.message } }, { status: saved.status });
  }
  return NextResponse.json({ data: { file: saved.file, field: saved.field, template: saved.template, pages: saved.pages } }, { status: 201 });
}
