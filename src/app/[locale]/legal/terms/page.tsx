import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getDatabase } from '@/lib/server';
import { getActiveDocumentVersion, type Locale } from '@/lib/consent';
import { MarkdownLite } from '@/components/markdown-lite';

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const db = await getDatabase();
  if (!db) notFound();

  const safeLocale: Locale = locale === 'th' ? 'th' : 'en';
  const doc = await getActiveDocumentVersion(db, 'terms', safeLocale);
  if (!doc) notFound();

  const t = await getTranslations('legal');

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article>
        <MarkdownLite source={doc.content} />
        <p className="mt-12 text-xs text-muted-foreground">
          {t('version')} {doc.version}
          {doc.effectiveAt ? ` · ${t('effective')} ${doc.effectiveAt.toLocaleDateString(safeLocale === 'th' ? 'th-TH' : 'en-US')}` : ''}
        </p>
      </article>
    </main>
  );
}
