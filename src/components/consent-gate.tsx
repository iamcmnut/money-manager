'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface ConsentRow {
  type: 'terms' | 'privacy';
  acceptedVersion: number | null;
  currentVersion: number | null;
  mustAccept: boolean;
}

interface ConsentsResponse {
  terms: ConsentRow;
  privacy: ConsentRow;
}

interface Props {
  children: ReactNode;
  locale: string;
}

/**
 * Wraps children that require accepted Terms + Privacy. If the current user
 * has stale or missing consents, blocks the children with a modal asking them
 * to read and accept. After acceptance, children render normally.
 */
export function ConsentGate({ children, locale }: Props) {
  const t = useTranslations('crowdData.consent');
  const [consents, setConsents] = useState<ConsentsResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/me/consents?locale=${locale}`);
      if (!res.ok) return;
      setConsents((await res.json()) as ConsentsResponse);
    } catch {
      // Network error or env without fetch (e.g. jsdom in tests). Treat as
      // "no consent info" — the gate stays closed and children render normally.
    }
  }, [locale]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const mustAccept = consents
    ? consents.terms.mustAccept || consents.privacy.mustAccept
    : false;

  async function acceptAll() {
    if (!consents) return;
    setSubmitting(true);
    setError(null);
    try {
      const promises: Promise<Response>[] = [];
      if (consents.terms.mustAccept && consents.terms.currentVersion) {
        promises.push(
          fetch('/api/me/consents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentType: 'terms', version: consents.terms.currentVersion }),
          }),
        );
      }
      if (consents.privacy.mustAccept && consents.privacy.currentVersion) {
        promises.push(
          fetch('/api/me/consents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentType: 'privacy', version: consents.privacy.currentVersion }),
          }),
        );
      }
      const results = await Promise.all(promises);
      if (results.some((r) => !r.ok)) {
        setError(t('saveError'));
        return;
      }
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={mustAccept}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('body')}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 py-2">
            <li className="rounded-lg border border-border p-3 text-sm">
              <Link
                href={`/${locale}/legal/terms`}
                target="_blank"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('termsHeading', { v: String(consents?.terms.currentVersion ?? '—') })}
              </Link>
              <div className="text-xs text-muted-foreground">
                {consents?.terms.acceptedVersion
                  ? t('previouslyAccepted', { v: String(consents.terms.acceptedVersion) })
                  : t('notYetAccepted')}
              </div>
            </li>
            <li className="rounded-lg border border-border p-3 text-sm">
              <Link
                href={`/${locale}/legal/privacy`}
                target="_blank"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('privacyHeading', { v: String(consents?.privacy.currentVersion ?? '—') })}
              </Link>
              <div className="text-xs text-muted-foreground">
                {consents?.privacy.acceptedVersion
                  ? t('previouslyAccepted', { v: String(consents.privacy.acceptedVersion) })
                  : t('notYetAccepted')}
              </div>
            </li>
          </ul>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button onClick={acceptAll} disabled={submitting}>
              {submitting ? t('saving') : t('accept')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
}
