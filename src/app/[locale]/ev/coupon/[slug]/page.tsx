import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';
import { Link } from '@/i18n/navigation';
import { CouponList } from './_components/coupon-list';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.ev.coupon' });

  // Fetch network name for SEO
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let networkName = slug;
  try {
    const res = await fetch(`${baseUrl}/api/ev/coupons/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      networkName = data.network?.name || slug;
    }
  } catch {
    // Fall back to slug
  }

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

  // Fetch coupon data server-side
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let network = null;
  let couponsList: Array<{
    id: string;
    code: string;
    descriptionEn: string | null;
    descriptionTh: string | null;
    conditionEn: string | null;
    conditionTh: string | null;
    startDate: string;
    endDate: string;
  }> = [];

  try {
    const res = await fetch(`${baseUrl}/api/ev/coupons/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      network = data.network;
      couponsList = data.coupons || [];
    }
  } catch {
    // Will show empty state
  }

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
