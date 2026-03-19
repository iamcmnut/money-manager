import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Car } from 'lucide-react';
import { EVDashboard } from './_components/ev-dashboard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'modules.ev' });

  return {
    title: t('title'),
    description: t('pageDescription'),
  };
}

export default async function EVPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EVPageContent />;
}

function EVPageContent() {
  const t = useTranslations('modules.ev');

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-6xl">
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
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container pb-16">
        <div className="mx-auto max-w-6xl">
          <EVDashboard />
        </div>
      </div>
    </div>
  );
}
