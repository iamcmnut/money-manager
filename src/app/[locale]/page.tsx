import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Home, PiggyBank } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomePageContent />;
}

function HomePageContent() {
  const t = useTranslations();

  const modules = [
    {
      titleKey: 'modules.ev.title' as const,
      descriptionKey: 'modules.ev.description' as const,
      href: '/ev' as const,
      icon: Car,
    },
    {
      titleKey: 'modules.livingCost.title' as const,
      descriptionKey: 'modules.livingCost.description' as const,
      href: '/living-cost' as const,
      icon: Home,
    },
    {
      titleKey: 'modules.savings.title' as const,
      descriptionKey: 'modules.savings.description' as const,
      href: '/savings' as const,
      icon: PiggyBank,
    },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {t('home.title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('home.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <module.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{t(module.titleKey)}</CardTitle>
                  <CardDescription>{t(module.descriptionKey)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-primary">{t('home.getStarted')} →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
