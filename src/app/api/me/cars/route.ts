import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { carBrands, carModels, userCars } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface CreateCarBody {
  carModelId: string;
  nickname?: string;
  isDefault?: boolean;
}

function generateUserCarId(): string {
  return `user-car-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const cars = await db
    .select({
      id: userCars.id,
      carModelId: userCars.carModelId,
      nickname: userCars.nickname,
      isDefault: userCars.isDefault,
      createdAt: userCars.createdAt,
      modelName: carModels.name,
      modelYear: carModels.modelYear,
      batteryKwh: carModels.batteryKwh,
      brandId: carBrands.id,
      brandName: carBrands.name,
    })
    .from(userCars)
    .leftJoin(carModels, eq(carModels.id, userCars.carModelId))
    .leftJoin(carBrands, eq(carBrands.id, carModels.brandId))
    .where(eq(userCars.userId, session.user.id));
  return NextResponse.json({ cars });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as CreateCarBody;
  if (!body.carModelId) return NextResponse.json({ error: 'carModelId is required' }, { status: 400 });

  const userId = session.user.id;

  // First car becomes default automatically.
  const existing = await db.select({ id: userCars.id }).from(userCars).where(eq(userCars.userId, userId)).limit(1);
  const isDefault = existing.length === 0 ? true : Boolean(body.isDefault);

  if (isDefault) {
    await db.update(userCars).set({ isDefault: false }).where(eq(userCars.userId, userId));
  }

  const inserted = await db
    .insert(userCars)
    .values({
      id: generateUserCarId(),
      userId,
      carModelId: body.carModelId,
      nickname: body.nickname ?? null,
      isDefault,
      createdAt: new Date(),
    })
    .returning();
  return NextResponse.json({ car: inserted[0] }, { status: 201 });
}
