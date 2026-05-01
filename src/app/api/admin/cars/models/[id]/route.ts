import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { carModels } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface UpdateModelBody {
  name?: string;
  modelYear?: number | null;
  batteryKwh?: number | null;
  isActive?: boolean;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await request.json()) as UpdateModelBody;
  const updates: Partial<typeof carModels.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.modelYear !== undefined) updates.modelYear = body.modelYear;
  if (body.batteryKwh !== undefined) updates.batteryKwh = body.batteryKwh;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await db.update(carModels).set(updates).where(eq(carModels.id, id)).returning();
  if (updated.length === 0) return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  return NextResponse.json({ model: updated[0] });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  try {
    const deleted = await db.delete(carModels).where(eq(carModels.id, id)).returning();
    if (deleted.length === 0) return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('FOREIGN KEY')) {
      return NextResponse.json({ error: 'Model is in use by user cars' }, { status: 409 });
    }
    throw err;
  }
}
