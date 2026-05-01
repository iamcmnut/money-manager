import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { carBrands } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

interface CreateBrandBody {
  name: string;
  slug: string;
  logo?: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const brands = await db.select().from(carBrands).orderBy(asc(carBrands.name));
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as CreateBrandBody;
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(carBrands)
      .values({
        id: body.slug,
        name: body.name,
        slug: body.slug,
        logo: body.logo ?? null,
        createdAt: new Date(),
      })
      .returning();
    return NextResponse.json({ brand: inserted[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'Brand with this slug already exists' }, { status: 409 });
    }
    console.error('Failed to create car brand:', err);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
