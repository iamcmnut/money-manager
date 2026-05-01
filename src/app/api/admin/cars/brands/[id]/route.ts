import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { carBrands } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface UpdateBrandBody {
  name?: string;
  logo?: string | null;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await request.json()) as UpdateBrandBody;

  const updates: Partial<typeof carBrands.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.logo !== undefined) updates.logo = body.logo;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await db.update(carBrands).set(updates).where(eq(carBrands.id, id)).returning();
  if (updated.length === 0) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  return NextResponse.json({ brand: updated[0] });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await ctx.params;
  try {
    const deleted = await db.delete(carBrands).where(eq(carBrands.id, id)).returning();
    if (deleted.length === 0) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('FOREIGN KEY')) {
      return NextResponse.json({ error: 'Brand has models; remove them first' }, { status: 409 });
    }
    throw err;
  }
}
