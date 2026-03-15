import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.error' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AuthErrorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthErrorPageContent />;
}

function AuthErrorPageContent() {
  const t = useTranslations('auth.error');

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">{t('message')}</p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/">{t('returnHome')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
