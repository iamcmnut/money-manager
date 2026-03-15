import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function BossOfficeLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user) {
    redirect({ href: '/auth/signin?callbackUrl=/boss-office', locale });
    return null;
  }

  return <>{children}</>;
}
