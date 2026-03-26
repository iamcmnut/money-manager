import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';
import { Link } from '@/i18n/navigation';
import { CouponList } from './_components/coupon-list';
import { getDatabase } from '@/lib/server';
import { coupons, chargingNetworks } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

async function getNetworkWithCoupons(slug: string) {
  const db = getDatabase();
  if (!db) return { network: null, coupons: [] };

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

  return { network, coupons: validCoupons };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.ev.coupon' });

  const { network } = await getNetworkWithCoupons(slug);
  const networkName = network?.name || slug;

  return {
    title: t('pageTitle', { network: networkName }),
    description: t('pageDescription', { network: networkName }),
  };
}

export default async function CouponPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <FeatureGate flag="ev_coupon">
      <CouponPageContent slug={slug} />
    </FeatureGate>
  );
}

async function CouponPageContent({ slug }: { slug: string }) {
  const t = await getTranslations('modules.ev.coupon');
  const data = await getNetworkWithCoupons(slug);
  const network = data.network;
  const couponsList = data.coupons.map((c) => ({
    ...c,
    startDate: c.startDate instanceof Date ? c.startDate.toISOString() : String(c.startDate),
    endDate: c.endDate instanceof Date ? c.endDate.toISOString() : String(c.endDate),
  }));

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: network?.brandColor ? `${network.brandColor}20` : undefined }}
              >
                <Tag className="h-5 w-5" style={{ color: network?.brandColor || undefined }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t('pageTitle', { network: network?.name || slug })}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('pageDescription', { network: network?.name || slug })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons */}
      <div className="container pb-16">
        <div className="mx-auto max-w-6xl">
          <CouponList coupons={couponsList} brandColor={network?.brandColor || null} />
          <div className="mt-6">
            <Link
              href="/ev"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← {t('backToEv')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
