'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ConsentRow {
  type: 'terms' | 'privacy';
  acceptedVersion: number | null;
  currentVersion: number | null;
  mustAccept: boolean;
}

export function PrivacySettings({ locale }: { locale: string }) {
  const t = useTranslations('crowdData.settings.privacy');
  const tLegal = useTranslations('crowdData.settings.legal');
  const [defaultVisibility, setDefaultVisibility] = useState<'public' | 'private'>('private');
  const [consents, setConsents] = useState<{ terms: ConsentRow; privacy: ConsentRow } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [profileRes, consentsRes] = await Promise.all([
      fetch('/api/me/profile').then((r) => r.json() as Promise<{ profile: { defaultRecordVisibility: 'public' | 'private' } }>),
      fetch(`/api/me/consents?locale=${locale}`).then((r) => r.json() as Promise<{ terms: ConsentRow; privacy: ConsentRow }>),
    ]);
    setDefaultVisibility(profileRes.profile.defaultRecordVisibility);
    setConsents(consentsRes);
  }, [locale]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultRecordVisibility: defaultVisibility }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(t('saveError'));
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-3 text-base font-semibold">{t('title')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t('description')}</p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
            <input
              type="radio"
              name="vis"
              checked={defaultVisibility === 'private'}
              onChange={() => setDefaultVisibility('private')}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">{t('private')}</div>
              <div className="text-xs text-muted-foreground">{t('privateHelp')}</div>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5">
            <input
              type="radio"
              name="vis"
              checked={defaultVisibility === 'public'}
              onChange={() => setDefaultVisibility('public')}
              className="mt-0.5"
            />
            <div>
              <div className="text-sm font-medium">{t('public')}</div>
              <div className="text-xs text-muted-foreground">{t('publicHelp')}</div>
            </div>
          </label>
        </div>
        {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border p-5">
        <h2 className="mb-3 text-base font-semibold">{tLegal('title')}</h2>
        {consents && (
          <ul className="space-y-2 text-sm">
            <li>
              {tLegal('terms')}:{' '}
              {consents.terms.acceptedVersion === consents.terms.currentVersion
                ? tLegal('accepted', { v: String(consents.terms.acceptedVersion) })
                : tLegal('mustAccept', { v: String(consents.terms.currentVersion) })}{' '}
              ·{' '}
              <Link href={`/${locale}/legal/terms`} className="text-primary underline-offset-4 hover:underline">
                {tLegal('view')}
              </Link>
            </li>
            <li>
              {tLegal('privacy')}:{' '}
              {consents.privacy.acceptedVersion === consents.privacy.currentVersion
                ? tLegal('accepted', { v: String(consents.privacy.acceptedVersion) })
                : tLegal('mustAccept', { v: String(consents.privacy.currentVersion) })}{' '}
              ·{' '}
              <Link href={`/${locale}/legal/privacy`} className="text-primary underline-offset-4 hover:underline">
                {tLegal('view')}
              </Link>
            </li>
          </ul>
        )}
      </section>
    </div>
  );
}
