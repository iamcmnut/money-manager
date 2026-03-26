import { getKV } from './cloudflare';
import { getDatabase } from './server';
import { coupons, chargingNetworks } from './db/schema';
import { eq } from 'drizzle-orm';

const COUPON_CACHE_TTL = 300; // 5 minutes

/**
 * Invalidate all coupon-related KV cache keys for a given network.
 * Call this after any coupon create/update/delete.
 */
export async function invalidateCouponCache(networkId: string) {
  const kv = getKV();
  if (!kv) return;

  // Look up the network slug
  const db = getDatabase();
  if (!db) return;

  try {
    const result = await db
      .select({ slug: chargingNetworks.slug })
      .from(chargingNetworks)
      .where(eq(chargingNetworks.id, networkId))
      .limit(1);

    const slug = result[0]?.slug;

    await Promise.all([
      slug ? kv.delete(`cache:coupons:${slug}`) : Promise.resolve(),
      kv.delete('cache:coupons:active-networks'),
    ]);
  } catch (err) {
    console.error('Failed to invalidate coupon cache:', err);
  }
}

/**
 * Get network + valid coupons with KV caching.
 * Used by the public coupon page server component.
 */
export async function getCachedNetworkCoupons(slug: string) {
  const kv = getKV();
  const cacheKey = `cache:coupons:${slug}`;

  // Try cache first
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as {
          network: { id: string; name: string; slug: string; logo: string | null; brandColor: string | null; website: string | null; couponOgImageEn: string | null; couponOgImageTh: string | null } | null;
          coupons: Array<{
            id: string; code: string;
            descriptionEn: string | null; descriptionTh: string | null;
            conditionEn: string | null; conditionTh: string | null;
            startDate: string; endDate: string;
          }>;
        };
      }
    } catch {
      // Cache miss or parse error, continue to DB
    }
  }

  // Query DB
  const db = getDatabase();
  if (!db) return { network: null, coupons: [] };

  const { and, sql } = await import('drizzle-orm');

  const networkResult = await db
    .select({
      id: chargingNetworks.id,
      name: chargingNetworks.name,
      slug: chargingNetworks.slug,
      logo: chargingNetworks.logo,
      brandColor: chargingNetworks.brandColor,
      website: chargingNetworks.website,
      couponOgImageEn: chargingNetworks.couponOgImageEn,
      couponOgImageTh: chargingNetworks.couponOgImageTh,
    })
    .from(chargingNetworks)
    .where(eq(chargingNetworks.slug, slug))
    .limit(1);

  if (networkResult.length === 0) {
    return { network: null, coupons: [] };
  }

  const network = networkResult[0];
  const now = Math.floor(Date.now() / 1000);

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

  // Serialize dates for caching
  const serializedCoupons = validCoupons.map((c) => ({
    ...c,
    startDate: c.startDate instanceof Date ? c.startDate.toISOString() : String(c.startDate),
    endDate: c.endDate instanceof Date ? c.endDate.toISOString() : String(c.endDate),
  }));

  const responseData = { network, coupons: serializedCoupons };

  // Store in cache
  if (kv) {
    kv.put(cacheKey, JSON.stringify(responseData), { expirationTtl: COUPON_CACHE_TTL }).catch(() => {});
  }

  return responseData;
}
