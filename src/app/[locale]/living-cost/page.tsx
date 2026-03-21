import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Home, FolderTree, Target, LineChart, Bell, Clock } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.livingCost' });

  return {
    title: t('title'),
    description: t('pageDescription'),
  };
}

export default async function LivingCostPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <FeatureGate flag="module_living_cost">
      <LivingCostPageContent />
    </FeatureGate>
  );
}

function LivingCostPageContent() {
  const t = useTranslations('modules.livingCost');

  const features = [
    { icon: FolderTree, label: t('features.categorization') },
    { icon: Target, label: t('features.budgetPlanning') },
    { icon: LineChart, label: t('features.spendingTrends') },
    { icon: Bell, label: t('features.billReminders') },
  ];

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-module-living-muted">
                <Home className="h-5 w-5 text-module-living" />
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
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="container pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t('comingSoon')}
              </span>
            </div>

            <p className="mb-6 text-muted-foreground">
              {t('comingSoonDescription')}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <feature.icon className="h-4 w-4 text-module-living" />
                  <span className="text-sm font-medium">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
