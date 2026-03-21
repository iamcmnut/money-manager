import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PiggyBank, Target, BarChart3, Percent, Trophy, Clock } from 'lucide-react';
import { FeatureGate } from '@/components/feature-gate';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.savings' });

  return {
    title: t('title'),
    description: t('pageDescription'),
  };
}

export default async function SavingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <FeatureGate flag="module_savings">
      <SavingsPageContent />
    </FeatureGate>
  );
}

function SavingsPageContent() {
  const t = useTranslations('modules.savings');

  const features = [
    { icon: Target, label: t('features.goalSetting') },
    { icon: BarChart3, label: t('features.progressTracking') },
    { icon: Percent, label: t('features.interestCalculations') },
    { icon: Trophy, label: t('features.milestones') },
  ];

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-module-savings-muted">
                <PiggyBank className="h-5 w-5 text-module-savings" />
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
                  <feature.icon className="h-4 w-4 text-module-savings" />
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
