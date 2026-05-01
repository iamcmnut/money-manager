import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Calendar, Zap } from 'lucide-react';
import { getDatabase } from '@/lib/server';
import { chargingRecords, users } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { levelSummary } from '@/lib/level';
import { normalizeSlug } from '@/lib/slug';
import { getFeatureFlag } from '@/lib/feature-flags';
import { TierBadge } from '@/components/tier-badge';
import { LevelProgress } from '@/components/level-progress';
import { formatBaht, formatNumber } from '@/lib/format';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);

  const enabled = await getFeatureFlag('public_profile');
  if (!enabled) notFound();

  const slug = normalizeSlug(rawSlug);
  const db = await getDatabase();
  if (!db) notFound();

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
  if (userRows.length === 0) notFound();
  const user = userRows[0];
  if (user.deletedAt) notFound();

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
  const displayName = user.displayName ?? user.name ?? 'Anonymous EV driver';
  const sessions = Number(stats[0].sessions);
  const totalKwh = Number(stats[0].totalKwh);
  const totalThb = Number(stats[0].totalThb);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: displayName,
            image: user.image ?? undefined,
            url: `/${locale}/u/${slug}`,
          }),
        }}
      />

      <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <p className="font-mono text-sm text-muted-foreground">@{slug}</p>
            <div className="mt-2">
              <TierBadge level={summary.level} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <LevelProgress expTotal={user.expTotal} />
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-muted/30 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Sessions</dt>
            <dd className="mt-1 text-2xl font-bold">{formatNumber(sessions)}</dd>
          </div>
          <div className="rounded-xl bg-muted/30 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total kWh</dt>
            <dd className="mt-1 flex items-center gap-1 text-2xl font-bold">
              <Zap className="h-5 w-5 text-module-ev" aria-hidden="true" />
              {formatNumber(totalKwh, 1)}
            </dd>
          </div>
          <div className="rounded-xl bg-muted/30 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total spent</dt>
            <dd className="mt-1 text-2xl font-bold">{formatBaht(totalThb, 0)}</dd>
          </div>
        </dl>

        {user.createdAt && (
          <p className="mt-6 flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            Joined {user.createdAt.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long' })}
          </p>
        )}
      </div>
    </main>
  );
}
