import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { coupons, chargingNetworks } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getKV } from '@/lib/cloudflare';

const CACHE_TTL = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const db = getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { slug } = await params;

  try {
    // Check KV cache
    const kv = getKV();
    const cacheKey = `cache:coupons:${slug}`;

    if (kv) {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
        });
      }
    }

    // Find network by slug
    const networkResult = await db
      .select({
        id: chargingNetworks.id,
        name: chargingNetworks.name,
        slug: chargingNetworks.slug,
        logo: chargingNetworks.logo,
        brandColor: chargingNetworks.brandColor,
        website: chargingNetworks.website,
      })
      .from(chargingNetworks)
      .where(eq(chargingNetworks.slug, slug))
      .limit(1);

    if (networkResult.length === 0) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    const network = networkResult[0];
    const now = Math.floor(Date.now() / 1000);

    // Fetch valid coupons
    const validCoupons = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        descriptionEn: coupons.descriptionEn,
        descriptionTh: coupons.descriptionTh,
        conditionEn: coupons.conditionEn,
        conditionTh: coupons.conditionTh,
        startDate: coupons.startDate,
        endDate: coupons.endDate,
      })
      .from(coupons)
      .where(
        and(
          eq(coupons.networkId, network.id),
          eq(coupons.isActive, true),
          sql`${coupons.startDate} <= ${now}`,
          sql`${coupons.endDate} >= ${now}`
        )
      );

    const responseData = { network, coupons: validCoupons };

    // Cache
    if (kv) {
      kv.put(cacheKey, JSON.stringify(responseData), { expirationTtl: CACHE_TTL }).catch(() => {});
    }

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}
