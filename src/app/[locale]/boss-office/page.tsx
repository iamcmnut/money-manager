import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Settings, Users, Flag, Shield, Mail, UserCircle, BadgeCheck, Zap, FileText, History, Tag } from 'lucide-react';
import { FeatureFlagsPanel } from './_components/feature-flags';
import { UsersTable } from './_components/users-table';
import { ChargingNetworksTable } from './_components/charging-networks-table';
import { AdminChargingRecords } from './_components/admin-charging-records';
import { ReferralCodesTable } from './_components/referral-codes-table';
import { ChargingRecordsList } from '@/app/[locale]/ev/_components/charging-records-list';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function BossOfficePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user) {
    redirect({ href: '/auth/signin?callbackUrl=/boss-office', locale });
    return null;
  }

  return <BossOfficePageContent session={session} />;
}

type Session = {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
};

function BossOfficePageContent({ session }: { session: Session }) {
  const t = useTranslations('admin');

  return (
    <div>
      {/* Header */}
      <div className="pb-6 pt-8 md:pb-10 md:pt-14">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <Settings className="h-5 w-5 text-accent-foreground" />
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

      {/* Content */}
      <div className="container pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Users Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{t('users')}</h2>
                  <p className="text-xs text-muted-foreground">{t('usersDescription')}</p>
                </div>
              </div>
              <UsersTable />
            </div>

            {/* Feature Flags Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Flag className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{t('featureFlags')}</h2>
                  <p className="text-xs text-muted-foreground">{t('featureFlagsDescription')}</p>
                </div>
              </div>
              <FeatureFlagsPanel />
            </div>

            {/* EV Charging Networks Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{t('evNetworks.title')}</h2>
                  <p className="text-xs text-muted-foreground">{t('evNetworks.description')}</p>
                </div>
              </div>
              <ChargingNetworksTable />
            </div>

            {/* EV Charging Records Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{t('chargingRecords.title')}</h2>
                  <p className="text-xs text-muted-foreground">{t('chargingRecords.description')}</p>
                </div>
              </div>
              <AdminChargingRecords />
            </div>

            {/* Referral Codes Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-6 md:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <Tag className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold">{t('referralCodes.title')}</h2>
                  <p className="text-xs text-muted-foreground">{t('referralCodes.description')}</p>
                </div>
              </div>
              <ReferralCodesTable />
            </div>
          </div>

          {/* My EV Charging History Card */}
          <div className="mt-4 rounded-xl border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <History className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold">{t('evHistory.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('evHistory.description')}</p>
              </div>
            </div>
            <ChargingRecordsList />
          </div>

          {/* Session Info */}
          <div className="mt-4 rounded-xl border bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold">{t('sessionInfo')}</h2>
                <p className="text-xs text-muted-foreground">{t('sessionInfoDescription')}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('name')}</p>
                <p className="mt-0.5 text-sm font-medium">{session.user.name ?? t('na')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('email')}</p>
                <p className="mt-0.5 text-sm font-medium truncate">{session.user.email}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{t('role')}</p>
                <p className="mt-0.5 text-sm font-medium capitalize">{session.user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
