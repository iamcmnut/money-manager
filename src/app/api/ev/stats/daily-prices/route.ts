import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getKV } from '@/lib/cloudflare';

const CACHE_TTL = 60; // seconds

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  const db = getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    // Parse date range from query params (default: 90 days)
    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '90';

    // Check KV cache
    const kv = getKV();
    const cacheKey = `cache:daily-prices:${userId || 'public'}:${range}`;

    if (kv) {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return NextResponse.json(JSON.parse(cached), {
          headers: {
            'Cache-Control': userId
              ? 'private, max-age=60, stale-while-revalidate=300'
              : 'public, s-maxage=60, stale-while-revalidate=300',
          },
        });
      }
    }

    // Build filters
    const filters = [];
    if (userId) {
      filters.push(eq(chargingRecords.userId, userId));
    }
    if (range !== 'all') {
      const daysAgo = parseInt(range, 10) || 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      filters.push(gte(chargingRecords.chargingDatetime, cutoff));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Query daily avg price per network
    const rows = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`,
        brandId: chargingRecords.brandId,
        brandName: chargingNetworks.name,
        brandColor: chargingNetworks.brandColor,
        avgPrice: sql<number>`ROUND(AVG(${chargingRecords.costThb} / ${chargingRecords.chargedKwh}), 2)`,
      })
      .from(chargingRecords)
      .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
      .where(whereClause)
      .groupBy(
        sql`strftime('%Y-%m-%d', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`,
        chargingRecords.brandId
      )
      .orderBy(sql`strftime('%Y-%m-%d', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`);

    // Collect unique networks
    const networkMap = new Map<string, { name: string; color: string }>();
    for (const row of rows) {
      if (!networkMap.has(row.brandId)) {
        networkMap.set(row.brandId, {
          name: row.brandName || row.brandId,
          color: row.brandColor || '#6B7280',
        });
      }
    }

    // Pivot rows into { date, networkA: price, networkB: price, ... }
    const dateMap = new Map<string, Record<string, string | number>>();
    for (const row of rows) {
      const networkName = row.brandName || row.brandId;
      if (!dateMap.has(row.date)) {
        dateMap.set(row.date, { date: row.date });
      }
      dateMap.get(row.date)![networkName] = row.avgPrice;
    }

    const dailyPrices = Array.from(dateMap.values());
    const networks = Array.from(networkMap.values());

    const responseData = { dailyPrices, networks };

    // Cache
    if (kv) {
      kv.put(cacheKey, JSON.stringify(responseData), { expirationTtl: CACHE_TTL }).catch(() => {});
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': userId
          ? 'private, max-age=60, stale-while-revalidate=300'
          : 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch daily prices:', error);
    return NextResponse.json({ error: 'Failed to fetch daily prices' }, { status: 500 });
  }
}
