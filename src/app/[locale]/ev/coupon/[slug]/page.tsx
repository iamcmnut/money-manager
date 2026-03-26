import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';
import { Link } from '@/i18n/navigation';
import { CouponList } from './_components/coupon-list';
import { getCachedNetworkCoupons } from '@/lib/coupon-cache';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manager.money';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.ev.coupon' });

  const { network } = await getCachedNetworkCoupons(slug);
  const networkName = network?.name || slug;

  const title = t('pageTitle', { network: networkName });
  const description = t('pageDescription', { network: networkName });

  const customOgImage = locale === 'th' ? network?.couponOgImageTh : network?.couponOgImageEn;
  const ogImageUrl = customOgImage
    ? (customOgImage.startsWith('http') ? customOgImage : `${baseUrl}${customOgImage}`)
    : `${baseUrl}/ev/manager.money-ev-${locale}.png`;

  const url = `${baseUrl}/${locale}/ev/coupon/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Manager.money',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [ogImageUrl],
    },
    other: {
      'og:locale:alternate': locale === 'th' ? 'en_US' : 'th_TH',
    },
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
  const data = await getCachedNetworkCoupons(slug);
  const network = data.network;
  const couponsList = data.coupons;

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
