import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Car, History } from 'lucide-react';
import { auth } from '@/lib/auth';
import { FeatureGate } from '@/components/feature-gate';
import { ChargingRecordsList } from '../_components/charging-records-list';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EVHistoryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/ev/history`);
  }

  return (
    <FeatureGate flag="ev_history">
      <EVHistoryContent />
    </FeatureGate>
  );
}

function EVHistoryContent() {
  const t = useTranslations('modules.ev');

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-module-ev-muted">
                <History className="h-5 w-5 text-module-ev" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t('historyPage.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('historyPage.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="container pb-16">
        <div className="mx-auto max-w-6xl">
          <ChargingRecordsList />
        </div>
      </div>
    </div>
  );
}
