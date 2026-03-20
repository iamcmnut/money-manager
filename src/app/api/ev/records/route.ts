import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const [records, countResult] = await Promise.all([
      db
        .select({
          id: chargingRecords.id,
          brandId: chargingRecords.brandId,
          brandName: chargingNetworks.name,
          brandColor: chargingNetworks.brandColor,
          brandLogo: chargingNetworks.logo,
          chargingDatetime: chargingRecords.chargingDatetime,
          chargedKwh: chargingRecords.chargedKwh,
          costThb: chargingRecords.costThb,
          avgUnitPrice: chargingRecords.avgUnitPrice,
          mileageKm: chargingRecords.mileageKm,
          notes: chargingRecords.notes,
          createdAt: chargingRecords.createdAt,
        })
        .from(chargingRecords)
        .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
        .where(eq(chargingRecords.userId, session.user.id))
        .orderBy(desc(chargingRecords.chargingDatetime))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chargingRecords)
        .where(eq(chargingRecords.userId, session.user.id)),
    ]);

    const total = countResult[0].count;

    return NextResponse.json({ records, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch charging records:', error);
    return NextResponse.json({ error: 'Failed to fetch charging records' }, { status: 500 });
  }
}

interface CreateRecordBody {
  brandId: string;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  mileageKm?: number;
  notes?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CreateRecordBody;

    if (!body.brandId || !body.chargingDatetime || body.chargedKwh === undefined || body.costThb === undefined) {
      return NextResponse.json(
        { error: 'Brand, charging datetime, charged kWh, and cost are required' },
        { status: 400 }
      );
    }

    // Store as integers (cents/satang)
    const chargedKwhCents = Math.round(body.chargedKwh * 100);
    const costThbSatang = Math.round(body.costThb * 100);
    const avgUnitPrice = chargedKwhCents > 0 ? Math.round(costThbSatang / chargedKwhCents * 100) : null;

    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const record = await db
      .insert(chargingRecords)
      .values({
        id,
        userId: session.user.id,
        brandId: body.brandId,
        chargingDatetime: new Date(body.chargingDatetime),
        chargedKwh: chargedKwhCents,
        costThb: costThbSatang,
        avgUnitPrice,
        mileageKm: body.mileageKm ? Math.round(body.mileageKm) : null,
        notes: body.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ record: record[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create charging record:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
      return NextResponse.json({ error: 'Invalid network selected' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create charging record' }, { status: 500 });
  }
}
