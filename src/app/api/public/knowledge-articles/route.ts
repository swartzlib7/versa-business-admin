import { NextResponse } from 'next/server';
import { adapter } from '@/lib/data';

// GET /api/public/knowledge-articles — public knowledge article list (no auth required)
export async function GET() {
  const articles = await adapter.listKnowledgeArticles();
  return NextResponse.json({ data: articles, count: articles.length });
}
