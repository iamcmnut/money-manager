import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { legalDocuments } from '@/lib/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';

interface CreateDocBody {
  type: 'terms' | 'privacy';
  locale: 'en' | 'th';
  version: number;
  content: string;
  effectiveAt?: number;
  activate?: boolean;
}

function generateDocId(type: string, locale: string, version: number): string {
  return `legal-${type}-${locale}-v${version}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const docs = await db
    .select()
    .from(legalDocuments)
    .orderBy(asc(legalDocuments.type), asc(legalDocuments.locale), desc(legalDocuments.version));
  return NextResponse.json({ documents: docs });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as CreateDocBody;
  if (!body.type || !body.locale || !body.version || !body.content) {
    return NextResponse.json({ error: 'type, locale, version, content are required' }, { status: 400 });
  }

  const effectiveAt = body.effectiveAt ? new Date(body.effectiveAt * 1000) : new Date();
  const id = generateDocId(body.type, body.locale, body.version);

  try {
    await db.insert(legalDocuments).values({
      id,
      type: body.type,
      locale: body.locale,
      version: body.version,
      content: body.content,
      effectiveAt,
      isActive: false,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'This version already exists' }, { status: 409 });
    }
    throw err;
  }

  if (body.activate) {
    // Deactivate prior versions for this (type, locale), then activate this one
    await db
      .update(legalDocuments)
      .set({ isActive: false })
      .where(and(eq(legalDocuments.type, body.type), eq(legalDocuments.locale, body.locale)));
    await db.update(legalDocuments).set({ isActive: true }).where(eq(legalDocuments.id, id));
  }

  const inserted = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
  return NextResponse.json({ document: inserted[0] }, { status: 201 });
}
