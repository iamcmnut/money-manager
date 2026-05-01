import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { getActiveDocumentVersion, type DocumentType, type Locale } from '@/lib/consent';

const VALID_TYPES = new Set<DocumentType>(['terms', 'privacy']);
const VALID_LOCALES = new Set<Locale>(['en', 'th']);

export async function GET(request: Request, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params;
  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale') ?? 'en';

  if (!VALID_TYPES.has(type as DocumentType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  }
  if (!VALID_LOCALES.has(localeParam as Locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const doc = await getActiveDocumentVersion(db, type as DocumentType, localeParam as Locale);
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  return NextResponse.json(
    { type, locale: localeParam, version: doc.version, content: doc.content, effectiveAt: doc.effectiveAt },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
