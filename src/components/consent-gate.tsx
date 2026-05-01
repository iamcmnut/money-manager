'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
        setError('Failed to record acceptance. Please try again.');
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
            <DialogTitle>Accept Terms &amp; Privacy</DialogTitle>
            <DialogDescription>
              Before you submit charging data, please review and accept our Terms of Service and Privacy Policy.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 py-2">
            <li className="rounded-lg border border-border p-3 text-sm">
              <Link
                href={`/${locale}/legal/terms`}
                target="_blank"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Terms of Service (v{consents?.terms.currentVersion ?? '—'})
              </Link>
              <div className="text-xs text-muted-foreground">
                {consents?.terms.acceptedVersion
                  ? `You previously accepted v${consents.terms.acceptedVersion}.`
                  : 'Not yet accepted.'}
              </div>
            </li>
            <li className="rounded-lg border border-border p-3 text-sm">
              <Link
                href={`/${locale}/legal/privacy`}
                target="_blank"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy (v{consents?.privacy.currentVersion ?? '—'})
              </Link>
              <div className="text-xs text-muted-foreground">
                {consents?.privacy.acceptedVersion
                  ? `You previously accepted v${consents.privacy.acceptedVersion}.`
                  : 'Not yet accepted.'}
              </div>
            </li>
          </ul>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button onClick={acceptAll} disabled={submitting}>
              {submitting ? 'Saving…' : 'I accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
}
