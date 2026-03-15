import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Settings, Users, Flag, Shield, Mail, UserCircle, BadgeCheck, Zap, FileText } from 'lucide-react';
import { FeatureFlagsPanel } from './_components/feature-flags';
import { UsersTable } from './_components/users-table';
import { ChargingNetworksTable } from './_components/charging-networks-table';
import { AdminChargingRecords } from './_components/admin-charging-records';

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
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-500/10 via-purple-500/5 to-transparent pb-12 pt-12 md:pb-16 md:pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 -top-10 h-[250px] w-[250px] md:h-[400px] md:w-[400px] rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container -mt-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Users Card */}
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-4 sm:p-6 shadow-lg">
              <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{t('users')}</h2>
                    <p className="text-sm text-muted-foreground">{t('usersDescription')}</p>
                  </div>
                </div>
                <UsersTable />
              </div>
            </div>

            {/* Feature Flags Card */}
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4 sm:p-6 shadow-lg">
              <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                    <Flag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{t('featureFlags')}</h2>
                    <p className="text-sm text-muted-foreground">{t('featureFlagsDescription')}</p>
                  </div>
                </div>
                <FeatureFlagsPanel />
              </div>
            </div>

            {/* EV Charging Networks Card */}
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-4 sm:p-6 shadow-lg">
              <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{t('evNetworks.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('evNetworks.description')}</p>
                  </div>
                </div>
                <ChargingNetworksTable />
              </div>
            </div>

            {/* EV Charging Records Card */}
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-4 sm:p-6 shadow-lg">
              <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{t('chargingRecords.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('chargingRecords.description')}</p>
                  </div>
                </div>
                <AdminChargingRecords />
              </div>
            </div>
          </div>

          {/* Session Info Card */}
          <div className="mt-4 sm:mt-6 relative overflow-hidden rounded-2xl border bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-4 sm:p-6 shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t('sessionInfo')}</h2>
                  <p className="text-sm text-muted-foreground">{t('sessionInfoDescription')}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border bg-background/50 p-4 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('name')}</p>
                    <p className="font-medium">{session.user.name ?? t('na')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border bg-background/50 p-4 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('email')}</p>
                    <p className="font-medium truncate">{session.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border bg-background/50 p-4 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <BadgeCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('role')}</p>
                    <p className="font-medium capitalize">{session.user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
