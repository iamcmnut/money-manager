'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const CONFIRM_KEYWORD = 'DELETE';

export function DangerZone() {
  const t = useTranslations('crowdData.settings.danger');
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmText !== CONFIRM_KEYWORD) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/me', { method: 'DELETE' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? t('deleteError'));
        return;
      }
      await signOut({ callbackUrl: '/' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="mb-2 text-base font-semibold text-destructive">{t('title')}</h2>
        <p className="mb-4 text-sm">{t('description')}</p>
        <label className="mb-3 block text-sm">
          {t.rich('confirmPrompt', {
            keyword: () => <span className="font-mono font-bold">{CONFIRM_KEYWORD}</span>,
          })}
          <input
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </label>
        {error && <div className="mb-3 text-sm text-destructive">{error}</div>}
        <Button variant="destructive" disabled={confirmText !== CONFIRM_KEYWORD || busy} onClick={deleteAccount}>
          {busy ? t('deleting') : t('deleteButton')}
        </Button>
      </section>
    </div>
  );
}
