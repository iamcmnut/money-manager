import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { coupons, chargingNetworks } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { invalidateCouponCache } from '@/lib/coupon-cache';

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
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const networkId = url.searchParams.get('networkId');
    const offset = (page - 1) * limit;

    const whereClause = networkId ? eq(coupons.networkId, networkId) : undefined;

    const [couponRows, countResult] = await Promise.all([
      db
        .select({
          id: coupons.id,
          networkId: coupons.networkId,
          networkName: chargingNetworks.name,
          networkSlug: chargingNetworks.slug,
          networkLogo: chargingNetworks.logo,
          networkBrandColor: chargingNetworks.brandColor,
          code: coupons.code,
          descriptionEn: coupons.descriptionEn,
          descriptionTh: coupons.descriptionTh,
          conditionEn: coupons.conditionEn,
          conditionTh: coupons.conditionTh,
          startDate: coupons.startDate,
          endDate: coupons.endDate,
          isActive: coupons.isActive,
          createdAt: coupons.createdAt,
          updatedAt: coupons.updatedAt,
        })
        .from(coupons)
        .leftJoin(chargingNetworks, eq(coupons.networkId, chargingNetworks.id))
        .where(whereClause)
        .orderBy(desc(coupons.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(coupons).where(whereClause),
    ]);

    const total = countResult[0].count;

    return NextResponse.json({ coupons: couponRows, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

interface CreateCouponBody {
  networkId: string;
  code: string;
  descriptionEn?: string;
  descriptionTh?: string;
  conditionEn?: string;
  conditionTh?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export async function POST(request: Request) {
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
    const body = (await request.json()) as CreateCouponBody;

    if (!body.networkId || !body.code || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'networkId, code, startDate, and endDate are required' }, { status: 400 });
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    const id = `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const coupon = await db
      .insert(coupons)
      .values({
        id,
        networkId: body.networkId,
        code: body.code,
        descriptionEn: body.descriptionEn || null,
        descriptionTh: body.descriptionTh || null,
        conditionEn: body.conditionEn || null,
        conditionTh: body.conditionTh || null,
        startDate,
        endDate,
        isActive: body.isActive !== false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Invalidate cache for this network
    await invalidateCouponCache(body.networkId);

    return NextResponse.json({ coupon: coupon[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create coupon:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY')) {
      return NextResponse.json({ error: 'Invalid network selected' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
