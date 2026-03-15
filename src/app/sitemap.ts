import { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manager.money';

  const routes = ['', '/ev', '/living-cost', '/savings'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      const url = `${baseUrl}/${locale}${route}`;
      const alternates: Record<string, string> = {};

      for (const altLocale of locales) {
        alternates[altLocale] = `${baseUrl}/${altLocale}${route}`;
      }
      alternates['x-default'] = `${baseUrl}/${defaultLocale}${route}`;

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return sitemapEntries;
}
