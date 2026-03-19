import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    // Get overall stats
    const overallStats = await db
      .select({
        totalSessions: sql<number>`COUNT(*)`,
        totalKwh: sql<number>`COALESCE(SUM(${chargingRecords.chargedKwh}), 0)`,
        totalCost: sql<number>`COALESCE(SUM(${chargingRecords.costThb}), 0)`,
      })
      .from(chargingRecords);

    const stats = overallStats[0];
    const totalKwhDecimal = stats.totalKwh / 100;
    const totalCostDecimal = stats.totalCost / 100;
    const avgPricePerKwh = totalKwhDecimal > 0 ? totalCostDecimal / totalKwhDecimal : 0;

    // Get stats per brand (for comparison chart)
    const brandStats = await db
      .select({
        brandId: chargingRecords.brandId,
        brandName: chargingNetworks.name,
        brandColor: chargingNetworks.brandColor,
        brandLogo: chargingNetworks.logo,
        brandPhone: chargingNetworks.phone,
        brandWebsite: chargingNetworks.website,
        sessions: sql<number>`COUNT(*)`,
        totalKwh: sql<number>`SUM(${chargingRecords.chargedKwh})`,
        totalCost: sql<number>`SUM(${chargingRecords.costThb})`,
      })
      .from(chargingRecords)
      .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
      .groupBy(
        chargingRecords.brandId,
        chargingNetworks.name,
        chargingNetworks.brandColor,
        chargingNetworks.logo,
        chargingNetworks.phone,
        chargingNetworks.website
      );

    // Calculate avg price for each brand
    const brandData = brandStats.map((brand) => ({
      brandId: brand.brandId,
      brandName: brand.brandName,
      brandColor: brand.brandColor,
      brandLogo: brand.brandLogo,
      brandPhone: brand.brandPhone,
      brandWebsite: brand.brandWebsite,
      sessions: brand.sessions,
      totalKwh: brand.totalKwh / 100,
      totalCost: brand.totalCost / 100,
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

    // Get the latest mileage reading to calculate avg cost/km
    const latestMileageResult = await db
      .select({
        mileageKm: chargingRecords.mileageKm,
      })
      .from(chargingRecords)
      .where(sql`${chargingRecords.mileageKm} IS NOT NULL`)
      .orderBy(sql`${chargingRecords.chargingDatetime} DESC`)
      .limit(1);

    const latestMileageKm = latestMileageResult[0]?.mileageKm ?? 0;
    let totalDistanceKm = latestMileageKm;
    let avgCostPerKm = 0;

    if (latestMileageKm > 0) {
      avgCostPerKm = totalCostDecimal / latestMileageKm;
    }

    // Get monthly trend (last 6 months)
    const monthlyTrend = await db
      .select({
        month: sql<string>`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`,
        totalKwh: sql<number>`SUM(${chargingRecords.chargedKwh})`,
        totalCost: sql<number>`SUM(${chargingRecords.costThb})`,
        sessions: sql<number>`COUNT(*)`,
      })
      .from(chargingRecords)
      .groupBy(sql`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`)
      .orderBy(sql`strftime('%Y-%m', datetime(${chargingRecords.chargingDatetime}, 'unixepoch'))`);

    const monthlyData = monthlyTrend.map((month) => ({
      month: month.month,
      totalKwh: month.totalKwh / 100,
      totalCost: month.totalCost / 100,
      sessions: month.sessions,
    }));

    return NextResponse.json({
      stats: {
        totalSessions: stats.totalSessions,
        totalKwh: totalKwhDecimal,
        totalCost: totalCostDecimal,
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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to fetch charging stats:', error);
    return NextResponse.json({ error: 'Failed to fetch charging stats' }, { status: 500 });
  }
}
