import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Car, History } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { EVDashboard } from './_components/ev-dashboard';
import { BreadcrumbJsonLd, WebApplicationJsonLd } from '@/components/seo/json-ld';
import { FeatureGate } from '@/components/feature-gate';
import { getFeatureFlag } from '@/lib/feature-flags';
import { auth } from '@/lib/auth';

type Props = {
  params: Promise<{ locale: string }>;
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manager.money';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.ev' });

  const title = t('title');
  const description = t('pageDescription');
  const url = `${baseUrl}/${locale}/ev`;

  return {
    title,
    description,
    keywords:
      locale === 'th'
        ? [
            'ค่าชาร์จรถไฟฟ้า',
            'EV charging ราคา',
            'เปรียบเทียบค่าชาร์จ EV',
            'ชาร์จรถยนต์ไฟฟ้า',
            'ค่าไฟชาร์จ EV',
            'สถานีชาร์จ EV ประเทศไทย',
            'ต้นทุนชาร์จ EV ต่อ kWh',
          ]
        : [
            'EV charging cost',
            'EV charging price comparison',
            'electric vehicle charging Thailand',
            'EV charging cost per kWh',
            'EV charging station price',
            'compare EV charging networks',
          ],
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Manager.money',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      images: [
        {
          url: `${baseUrl}/ev/manager.money-ev-${locale}.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/ev/manager.money-ev-${locale}.png`],
    },
    other: {
      'og:locale:alternate': locale === 'th' ? 'en_US' : 'th_TH',
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${baseUrl}/en/ev`,
        th: `${baseUrl}/th/ev`,
      },
    },
  };
}

export default async function EVPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [showDailyPriceChart, showCoupon, showHistory, session] = await Promise.all([
    getFeatureFlag('ev_daily_price_chart'),
    getFeatureFlag('ev_coupon'),
    getFeatureFlag('ev_history'),
    auth(),
  ]);

  const showHistoryButton = showHistory && !!session?.user;

  return (
    <FeatureGate flag="module_ev">
      <EVPageContent locale={locale} showDailyPriceChart={showDailyPriceChart} showCoupon={showCoupon} showHistoryButton={showHistoryButton} />
    </FeatureGate>
  );
}

function EVPageContent({ locale, showDailyPriceChart, showCoupon, showHistoryButton }: { locale: string; showDailyPriceChart: boolean; showCoupon: boolean; showHistoryButton: boolean }) {
  const t = useTranslations('modules.ev');
  const navT = useTranslations('nav');

  const url = `${baseUrl}/${locale}/ev`;

  return (
    <div>
      <BreadcrumbJsonLd
        items={[
          { name: navT('home'), url: `${baseUrl}/${locale}` },
          { name: t('title'), url },
        ]}
      />
      <WebApplicationJsonLd
        name={t('title')}
        description={t('pageDescription')}
        url={url}
        applicationCategory="FinanceApplication"
        inLanguage={['en', 'th']}
      />

      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-module-ev-muted">
                  <Car className="h-5 w-5 text-module-ev" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {t('title')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t('description')}
                  </p>
                </div>
              </div>
              {showHistoryButton && (
                <Link
                  href="/ev/history"
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('historyPage.title')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container pb-16">
        <div className="mx-auto max-w-6xl">
          <EVDashboard showDailyPriceChart={showDailyPriceChart} showCoupon={showCoupon} />
        </div>
      </div>
    </div>
  );
}
