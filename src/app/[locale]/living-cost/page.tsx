import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Home, FolderTree, Target, LineChart, Bell, Clock } from 'lucide-react';

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

  return <LivingCostPageContent />;
}

function LivingCostPageContent() {
  const t = useTranslations('modules.livingCost');

  const features = [
    { icon: FolderTree, label: t('features.categorization'), color: 'from-orange-500 to-red-500' },
    { icon: Target, label: t('features.budgetPlanning'), color: 'from-amber-500 to-orange-500' },
    { icon: LineChart, label: t('features.spendingTrends'), color: 'from-yellow-500 to-amber-500' },
    { icon: Bell, label: t('features.billReminders'), color: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent pb-12 pt-12 md:pb-16 md:pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 -top-10 h-[250px] w-[250px] md:h-[400px] md:w-[400px] rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-amber-500/20 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="container -mt-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-orange-500/5 to-amber-500/5 p-6 sm:p-8 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {t('comingSoon')}
                </span>
              </div>

              <p className="mb-8 text-muted-foreground">
                {t('comingSoonDescription')}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} shadow-md`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
