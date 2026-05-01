import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { users } from '@/lib/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { isValidSlug, normalizeSlug, validateSlugFormat } from '@/lib/slug';
import { levelSummary } from '@/lib/level';

interface UpdateProfileBody {
  slug?: string;
  displayName?: string | null;
  defaultRecordVisibility?: 'public' | 'private';
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      role: users.role,
      isPreApproved: users.isPreApproved,
      publicSlug: users.publicSlug,
      displayName: users.displayName,
      defaultRecordVisibility: users.defaultRecordVisibility,
      expTotal: users.expTotal,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const u = rows[0];
  const summary = levelSummary(u.expTotal);
  return NextResponse.json({
    profile: {
      ...u,
      level: summary.level,
      tier: summary.tier.name,
      expIntoLevel: summary.expIntoLevel,
      expToNext: summary.expToNext,
      progress: summary.progress,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as UpdateProfileBody;
  const updates: Partial<typeof users.$inferInsert> = {};

  if (body.slug !== undefined) {
    const normalized = normalizeSlug(body.slug);
    const reason = validateSlugFormat(normalized);
    if (reason) return NextResponse.json({ error: 'Invalid slug', reason }, { status: 400 });
    if (!isValidSlug(normalized)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.publicSlug, normalized), ne(users.id, session.user.id)))
      .limit(1);
    if (taken.length > 0) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
    updates.publicSlug = normalized;
  }
  if (body.displayName !== undefined) {
    const trimmed = body.displayName?.trim() ?? null;
    if (trimmed && trimmed.length > 60) {
      return NextResponse.json({ error: 'Display name too long' }, { status: 400 });
    }
    updates.displayName = trimmed;
  }
  if (body.defaultRecordVisibility !== undefined) {
    if (body.defaultRecordVisibility !== 'public' && body.defaultRecordVisibility !== 'private') {
      return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
    }
    updates.defaultRecordVisibility = body.defaultRecordVisibility;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  updates.updatedAt = new Date();
  await db.update(users).set(updates).where(eq(users.id, session.user.id));
  return NextResponse.json({ ok: true });
}
