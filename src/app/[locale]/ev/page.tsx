import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

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
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
              <p className="text-muted-foreground">{t('description')}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('comingSoon')}</CardTitle>
            <CardDescription>{t('comingSoonDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('featuresPlanned')}</p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>{t('features.homeCharging')}</li>
              <li>{t('features.publicCharging')}</li>
              <li>{t('features.monthlyExpense')}</li>
              <li>{t('features.costPerKm')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
