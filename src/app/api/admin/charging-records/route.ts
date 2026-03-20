import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks, users } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    const [records, countResult] = await Promise.all([
      db
        .select({
          id: chargingRecords.id,
          userId: chargingRecords.userId,
          userName: users.name,
          userEmail: users.email,
          brandId: chargingRecords.brandId,
          brandName: chargingNetworks.name,
          brandColor: chargingNetworks.brandColor,
          chargingDatetime: chargingRecords.chargingDatetime,
          chargedKwh: chargingRecords.chargedKwh,
          costThb: chargingRecords.costThb,
          avgUnitPrice: chargingRecords.avgUnitPrice,
          mileageKm: chargingRecords.mileageKm,
          notes: chargingRecords.notes,
          createdAt: chargingRecords.createdAt,
        })
        .from(chargingRecords)
        .leftJoin(users, eq(chargingRecords.userId, users.id))
        .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
        .orderBy(desc(chargingRecords.chargingDatetime))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(chargingRecords),
    ]);

    const total = countResult[0].count;

    return NextResponse.json({ records, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch charging records:', error);
    return NextResponse.json({ error: 'Failed to fetch charging records' }, { status: 500 });
  }
}
