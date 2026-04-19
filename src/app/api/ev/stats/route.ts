import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { getKV } from '@/lib/cloudflare';

const STATS_CACHE_TTL = 60; // seconds

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  const db = getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    // Parse month filter from query params (format: YYYY-MM)
    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month');

    // Check KV cache first
    const kv = getKV();
    const cacheKey = `cache:stats:${userId || 'public'}:${month || 'all'}`;

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

    // Run all queries in parallel
    // If logged in, scope to user's data; otherwise show all aggregated data
    const userFilter = userId ? eq(chargingRecords.userId, userId) : undefined;

    // Build month date range filter
    let monthFilter: ReturnType<typeof and> | undefined;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 1);
      monthFilter = and(
        gte(chargingRecords.chargingDatetime, startDate),
        lt(chargingRecords.chargingDatetime, endDate)
      );
    }

    // Combined filter for main queries (user + month)
    const mainFilter = and(userFilter, monthFilter);
    const mileageFilter = and(
      mainFilter,
      sql`${chargingRecords.mileageKm} IS NOT NULL`
    );

    const [overallStats, brandStats, latestMileageResult, monthlyTrend] = await Promise.all([
      // Overall stats
      db
        .select({
          totalSessions: sql<number>`COUNT(*)`,
          totalKwh: sql<number>`COALESCE(SUM(${chargingRecords.chargedKwh}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${chargingRecords.costThb}), 0)`,
        })
        .from(chargingRecords)
        .where(mainFilter),

      // Stats per brand
      db
        .select({
          brandId: chargingRecords.brandId,
          brandName: chargingNetworks.name,
          brandSlug: chargingNetworks.slug,
          brandColor: chargingNetworks.brandColor,
          brandLogo: chargingNetworks.logo,
          brandPhone: chargingNetworks.phone,
          brandWebsite: chargingNetworks.website,
          sessions: sql<number>`COUNT(*)`,
          totalKwh: sql<number>`SUM(${chargingRecords.chargedKwh})`,
          totalCost: sql<number>`SUM(${chargingRecords.costThb})`,
        })
        .from(chargingRecords)
        .where(mainFilter)
        .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
        .groupBy(
          chargingRecords.brandId,
          chargingNetworks.name,
          chargingNetworks.slug,
          chargingNetworks.brandColor,
          chargingNetworks.logo,
          chargingNetworks.phone,
          chargingNetworks.website
        ),

      // Latest mileage
      db
        .select({ mileageKm: chargingRecords.mileageKm })
        .from(chargingRecords)
        .where(mileageFilter)
        .orderBy(sql`${chargingRecords.chargingDatetime} DESC`)
        .limit(1),

      // Monthly trend (always unfiltered by month so dropdown can show all available months)
      db
        .select({
          month: sql<string>`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`,
          totalKwh: sql<number>`SUM(${chargingRecords.chargedKwh})`,
          totalCost: sql<number>`SUM(${chargingRecords.costThb})`,
          sessions: sql<number>`COUNT(*)`,
        })
        .from(chargingRecords)
        .where(userFilter)
        .groupBy(sql`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`)
        .orderBy(sql`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`),
    ]);

    const stats = overallStats[0];
    const avgPricePerKwh = stats.totalKwh > 0 ? stats.totalCost / stats.totalKwh : 0;

    // Calculate avg price for each brand
    const brandData = brandStats.map((brand) => ({
      brandId: brand.brandId,
      brandName: brand.brandName,
      brandSlug: brand.brandSlug,
      brandColor: brand.brandColor,
      brandLogo: brand.brandLogo,
      brandPhone: brand.brandPhone,
      brandWebsite: brand.brandWebsite,
      sessions: brand.sessions,
      totalKwh: brand.totalKwh,
      totalCost: brand.totalCost,
      avgPricePerKwh: brand.totalKwh > 0 ? (brand.totalCost / brand.totalKwh) : 0,
    }));

    // Find cheapest network
    const cheapestNetwork = brandData.length > 0
      ? brandData.reduce((prev, current) =>
          (current.avgPricePerKwh < prev.avgPricePerKwh ? current : prev)
        )
      : null;

    const cheapestPrice = cheapestNetwork?.avgPricePerKwh || 0;

    // Add price comparison (% more expensive than cheapest)
    const brandComparison = brandData.map((brand) => ({
      ...brand,
      isCheapest: cheapestNetwork?.brandId === brand.brandId,
      priceDiffPercent: cheapestPrice > 0
        ? Math.round(((brand.avgPricePerKwh - cheapestPrice) / cheapestPrice) * 10000) / 100
        : 0,
    }));

    // Find most used network
    const mostUsedNetwork = brandComparison.length > 0
      ? brandComparison.reduce((prev, current) => (prev.sessions > current.sessions ? prev : current))
      : null;

    const latestMileageKm = latestMileageResult[0]?.mileageKm ?? 0;
    let totalDistanceKm = latestMileageKm;
    let avgCostPerKm = 0;

    if (latestMileageKm > 0) {
      avgCostPerKm = stats.totalCost / latestMileageKm;
    }

    const monthlyData = monthlyTrend.map((month) => ({
      month: month.month,
      totalKwh: month.totalKwh,
      totalCost: month.totalCost,
      sessions: month.sessions,
    }));

    const responseData = {
      stats: {
        totalSessions: stats.totalSessions,
        totalKwh: stats.totalKwh,
        totalCost: stats.totalCost,
        avgPricePerKwh: Math.round(avgPricePerKwh * 100) / 100,
        totalDistanceKm,
        avgCostPerKm: Math.round(avgCostPerKm * 100) / 100,
        mostUsedNetwork: mostUsedNetwork ? {
          brandId: mostUsedNetwork.brandId,
          brandName: mostUsedNetwork.brandName,
          sessions: mostUsedNetwork.sessions,
        } : null,
        cheapestNetwork: cheapestNetwork ? {
          brandId: cheapestNetwork.brandId,
          brandName: cheapestNetwork.brandName,
          avgPricePerKwh: Math.round(cheapestNetwork.avgPricePerKwh * 100) / 100,
        } : null,
      },
      brandComparison,
      monthlyData,
    };

    // Cache in KV (fire-and-forget, don't block response)
    if (kv) {
      kv.put(cacheKey, JSON.stringify(responseData), { expirationTtl: STATS_CACHE_TTL }).catch(() => {});
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': userId
          ? 'private, max-age=60, stale-while-revalidate=300'
          : 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch charging stats:', error);
    return NextResponse.json({ error: 'Failed to fetch charging stats' }, { status: 500 });
  }
}
