import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Car, Home, PiggyBank, ArrowRight, Sparkles } from 'lucide-react';

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
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      titleKey: 'modules.livingCost.title' as const,
      descriptionKey: 'modules.livingCost.description' as const,
      href: '/living-cost' as const,
      icon: Home,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
    },
    {
      titleKey: 'modules.savings.title' as const,
      descriptionKey: 'modules.savings.description' as const,
      href: '/savings' as const,
      icon: PiggyBank,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
    },
  ];

  return (
    <div className="relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/5 to-transparent pb-16 pt-12 md:pb-24 md:pt-20">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-1/2 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-[200px] w-[200px] md:h-[300px] md:w-[300px] rounded-full bg-green-500/10 blur-3xl" />
        </div>

        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t('home.subtitle')}</span>
            </div>
            <h1 className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              {t('home.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="container -mt-8 pb-16 md:pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {modules.map((module) => (
              <Link key={module.href} href={module.href} className="group">
                <div className={`relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br ${module.bgGradient} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5`}>
                  {/* Icon */}
                  <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${module.gradient} shadow-lg`}>
                    <module.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-xl font-semibold">{t(module.titleKey)}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t(module.descriptionKey)}
                  </p>

                  {/* Link */}
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <span>{t('home.getStarted')}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Decorative gradient */}
                  <div className={`absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${module.gradient} opacity-20 blur-3xl transition-opacity group-hover:opacity-30`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
