import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Settings } from 'lucide-react';
import { AdminTabs } from './_components/admin-tabs';

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
          <AdminTabs session={session} />
        </div>
      </div>
    </div>
  );
}
