import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { userConsents } from '@/lib/db/schema';
import { getUserConsentStatus, type DocumentType, type Locale } from '@/lib/consent';

interface PostBody {
  documentType: DocumentType;
  version: number;
}

function generateConsentId(): string {
  return `consent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale') ?? 'en';
  const locale: Locale = localeParam === 'th' ? 'th' : 'en';

  const [terms, privacy] = await Promise.all([
    getUserConsentStatus(db, session.user.id, 'terms', locale),
    getUserConsentStatus(db, session.user.id, 'privacy', locale),
  ]);
  return NextResponse.json({ terms, privacy });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as PostBody;
  if ((body.documentType !== 'terms' && body.documentType !== 'privacy') || !body.version) {
    return NextResponse.json({ error: 'documentType and version are required' }, { status: 400 });
  }

  try {
    await db.insert(userConsents).values({
      id: generateConsentId(),
      userId: session.user.id,
      documentType: body.documentType,
      version: body.version,
      acceptedAt: new Date(),
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      // Already accepted — idempotent
      return NextResponse.json({ ok: true });
    }
    throw err;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
