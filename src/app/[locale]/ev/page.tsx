import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
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

  const session = await auth();

  if (!session?.user) {
    redirect({ href: '/auth/signin?callbackUrl=/ev', locale });
    return null;
  }

  return <EVPageContent />;
}

function EVPageContent() {
  const t = useTranslations('modules.ev');

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent pb-8 pt-12 md:pb-12 md:pt-16">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 -top-10 h-[250px] w-[250px] md:h-[400px] md:w-[400px] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-cyan-500/20 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('description')}
            </p>
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
