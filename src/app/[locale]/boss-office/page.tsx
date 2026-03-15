import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Flag } from 'lucide-react';
import { FeatureFlagsPanel } from './_components/feature-flags';
import { UsersTable } from './_components/users-table';

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
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
              <p className="text-muted-foreground">{t('description')}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('users')}</CardTitle>
              </div>
              <CardDescription>{t('usersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('featureFlags')}</CardTitle>
              </div>
              <CardDescription>{t('featureFlagsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureFlagsPanel />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('sessionInfo')}</CardTitle>
              <CardDescription>{t('sessionInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="font-medium">{t('name')}:</dt>
                  <dd className="text-muted-foreground">{session.user.name ?? t('na')}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">{t('email')}:</dt>
                  <dd className="text-muted-foreground">{session.user.email}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium">{t('role')}:</dt>
                  <dd className="text-muted-foreground">{session.user.role}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
