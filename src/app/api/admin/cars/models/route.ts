import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { carBrands, carModels } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

interface CreateModelBody {
  brandId: string;
  name: string;
  modelYear?: number;
  batteryKwh?: number;
  isActive?: boolean;
}

function generateModelId(slug: string): string {
  return `model-${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const url = new URL(request.url);
  const brandId = url.searchParams.get('brandId');

  const query = db
    .select({
      id: carModels.id,
      brandId: carModels.brandId,
      brandName: carBrands.name,
      name: carModels.name,
      modelYear: carModels.modelYear,
      batteryKwh: carModels.batteryKwh,
      isActive: carModels.isActive,
      createdAt: carModels.createdAt,
    })
    .from(carModels)
    .leftJoin(carBrands, eq(carBrands.id, carModels.brandId))
    .orderBy(asc(carBrands.name), asc(carModels.name));

  const models = brandId ? await query.where(eq(carModels.brandId, brandId)) : await query;
  return NextResponse.json({ models });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as CreateModelBody;
  if (!body.brandId || !body.name) {
    return NextResponse.json({ error: 'brandId and name are required' }, { status: 400 });
  }

  const slugBase = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const inserted = await db
    .insert(carModels)
    .values({
      id: generateModelId(slugBase || 'm'),
      brandId: body.brandId,
      name: body.name,
      modelYear: body.modelYear ?? null,
      batteryKwh: body.batteryKwh ?? null,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
    })
    .returning();
  return NextResponse.json({ model: inserted[0] }, { status: 201 });
}
