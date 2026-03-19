import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Car, Home, PiggyBank, ArrowRight } from 'lucide-react';

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
      iconBg: 'bg-module-ev-muted',
      iconColor: 'text-module-ev',
      ctaColor: 'text-module-ev',
    },
    {
      titleKey: 'modules.livingCost.title' as const,
      descriptionKey: 'modules.livingCost.description' as const,
      href: '/living-cost' as const,
      icon: Home,
      iconBg: 'bg-module-living-muted',
      iconColor: 'text-module-living',
      ctaColor: 'text-module-living',
    },
    {
      titleKey: 'modules.savings.title' as const,
      descriptionKey: 'modules.savings.description' as const,
      href: '/savings' as const,
      icon: PiggyBank,
      iconBg: 'bg-module-savings-muted',
      iconColor: 'text-module-savings',
      ctaColor: 'text-module-savings',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="pb-12 pt-12 md:pb-16 md:pt-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {t('home.title')}
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              {t('home.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="container pb-16 md:pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {modules.map((module) => (
              <Link key={module.href} href={module.href} className="group">
                <div className="h-full rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${module.iconBg}`}>
                    <module.icon className={`h-5 w-5 ${module.iconColor}`} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold">{t(module.titleKey)}</h3>
                  <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
                    {t(module.descriptionKey)}
                  </p>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${module.ctaColor}`}>
                    <span>{t('home.getStarted')}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
