import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { coupons, chargingNetworks } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getKV } from '@/lib/cloudflare';

const CACHE_TTL = 60;

export async function GET() {
  const db = getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const kv = getKV();
    const cacheKey = 'cache:coupons:active-networks';

    if (kv) {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
        });
      }
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await db
      .selectDistinct({ slug: chargingNetworks.slug })
      .from(coupons)
      .innerJoin(chargingNetworks, eq(coupons.networkId, chargingNetworks.id))
      .where(
        and(
          eq(coupons.isActive, true),
          sql`${coupons.startDate} <= ${now}`,
          sql`${coupons.endDate} >= ${now}`
        )
      );

    const responseData = { slugs: result.map((r) => r.slug) };

    if (kv) {
      kv.put(cacheKey, JSON.stringify(responseData), { expirationTtl: CACHE_TTL }).catch(() => {});
    }

    return NextResponse.json(responseData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Failed to fetch active coupon networks:', error);
    return NextResponse.json({ error: 'Failed to fetch active networks' }, { status: 500 });
  }
}
