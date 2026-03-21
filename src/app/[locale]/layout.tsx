import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { WebsiteJsonLd } from '@/components/seo/json-ld';
import { routing } from '@/i18n/routing';
import { plexSans, plexSansThai, plexMono } from '../layout';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manager.money';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const metadata = messages.metadata as { title: string; description: string };

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: metadata.title,
      template: '%s | Manager.money',
    },
    description: metadata.description,
    keywords: ['personal finance', 'budgeting', 'savings', 'EV calculator', 'expense tracker'],
    authors: [{ name: 'Manager.money' }],
    creator: 'Manager.money',
    openGraph: {
      type: 'website',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      url: baseUrl,
      siteName: 'Manager.money',
      title: metadata.title,
      description: metadata.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/favicon.ico',
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        th: `${baseUrl}/th`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate that the locale is supported
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <WebsiteJsonLd
          name="Manager.money"
          description="A modular personal finance web application"
          url={baseUrl}
        />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
        <link rel="alternate" hrefLang="th" href={`${baseUrl}/th`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/en`} />
      </head>
      <body className={`${plexSans.variable} ${plexSansThai.variable} ${plexMono.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <CookieConsent />
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
