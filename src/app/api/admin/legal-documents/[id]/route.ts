import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { legalDocuments } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

interface UpdateBody {
  content?: string;
  isActive?: boolean;
  effectiveAt?: number;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await request.json()) as UpdateBody;

  const existing = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id)).limit(1);
  if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const doc = existing[0];

  const updates: Partial<typeof legalDocuments.$inferInsert> = {};
  if (body.content !== undefined) updates.content = body.content;
  if (body.effectiveAt !== undefined) updates.effectiveAt = new Date(body.effectiveAt * 1000);

  if (body.isActive === true) {
    // Deactivate all other versions for this (type, locale), then activate this one
    await db
      .update(legalDocuments)
      .set({ isActive: false })
      .where(and(eq(legalDocuments.type, doc.type), eq(legalDocuments.locale, doc.locale)));
    updates.isActive = true;
  } else if (body.isActive === false) {
    updates.isActive = false;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await db.update(legalDocuments).set(updates).where(eq(legalDocuments.id, id)).returning();
  return NextResponse.json({ document: updated[0] });
}
