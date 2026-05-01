import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, userCars } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface UpdateCarBody {
  nickname?: string | null;
  isDefault?: boolean;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  const userId = session.user.id;
  const body = (await request.json()) as UpdateCarBody;

  const owned = await db
    .select({ id: userCars.id })
    .from(userCars)
    .where(and(eq(userCars.id, id), eq(userCars.userId, userId)))
    .limit(1);
  if (owned.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.isDefault === true) {
    await db.update(userCars).set({ isDefault: false }).where(eq(userCars.userId, userId));
  }
  const updates: Partial<typeof userCars.$inferInsert> = {};
  if (body.nickname !== undefined) updates.nickname = body.nickname;
  if (body.isDefault !== undefined) updates.isDefault = body.isDefault;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  const updated = await db.update(userCars).set(updates).where(eq(userCars.id, id)).returning();
  return NextResponse.json({ car: updated[0] });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  const userId = session.user.id;

  const referenced = await db
    .select({ id: chargingRecords.id })
    .from(chargingRecords)
    .where(eq(chargingRecords.userCarId, id))
    .limit(1);
  if (referenced.length > 0) {
    return NextResponse.json(
      { error: 'This car is used in charging records. Reassign or delete those records first.' },
      { status: 409 },
    );
  }

  const deleted = await db
    .delete(userCars)
    .where(and(eq(userCars.id, id), eq(userCars.userId, userId)))
    .returning();
  if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
