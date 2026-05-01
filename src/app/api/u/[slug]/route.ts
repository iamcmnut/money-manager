import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { getKV } from '@/lib/cloudflare';
import { chargingRecords, users } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { levelSummary } from '@/lib/level';
import { normalizeSlug } from '@/lib/slug';

const PROFILE_CACHE_TTL = 300; // 5 min

interface PublicProfile {
  slug: string;
  displayName: string | null;
  image: string | null;
  expTotal: number;
  level: number;
  tier: string;
  joinedAt: string | null;
  stats: { sessions: number; totalKwh: number; totalThb: number };
}

export async function GET(_request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeSlug(rawSlug);

  const kv = getKV();
  const cacheKey = `cache:profile:${slug}`;

  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
          },
        });
      }
    } catch {
      // fall through
    }
  }

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const userRows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      name: users.name,
      image: users.image,
      expTotal: users.expTotal,
      createdAt: users.createdAt,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.publicSlug, slug))
    .limit(1);

  if (userRows.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  const user = userRows[0];
  if (user.deletedAt) return NextResponse.json({ error: 'Profile deleted' }, { status: 410 });

  const stats = await db
    .select({
      sessions: sql<number>`COUNT(*)`,
      totalKwh: sql<number>`COALESCE(SUM(${chargingRecords.chargedKwh}), 0)`,
      totalThb: sql<number>`COALESCE(SUM(${chargingRecords.costThb}), 0)`,
    })
    .from(chargingRecords)
    .where(
      and(
        eq(chargingRecords.userId, user.id),
        eq(chargingRecords.isShared, true),
        eq(chargingRecords.approvalStatus, 'approved'),
      ),
    );

  const summary = levelSummary(user.expTotal);
  const profile: PublicProfile = {
    slug,
    displayName: user.displayName ?? user.name ?? null,
    image: user.image,
    expTotal: user.expTotal,
    level: summary.level,
    tier: summary.tier.name,
    joinedAt: user.createdAt ? user.createdAt.toISOString() : null,
    stats: {
      sessions: Number(stats[0].sessions),
      totalKwh: Number(stats[0].totalKwh),
      totalThb: Number(stats[0].totalThb),
    },
  };

  const body = JSON.stringify({ profile });
  if (kv) {
    kv.put(cacheKey, body, { expirationTtl: PROFILE_CACHE_TTL }).catch(() => {});
  }

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
