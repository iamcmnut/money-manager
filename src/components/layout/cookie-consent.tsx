'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'declined' | 'pending';

function getSnapshot(): ConsentStatus {
  if (typeof window === 'undefined') {
    return 'pending';
  }
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored === 'accepted' || stored === 'declined') {
    return stored;
  }
  return 'pending';
}

function getServerSnapshot(): ConsentStatus {
  return 'pending';
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function CookieConsent() {
  const t = useTranslations('cookies');
  const storedStatus = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [localStatus, setLocalStatus] = useState<ConsentStatus | null>(null);

  const status = localStatus ?? storedStatus;

  const handleAccept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setLocalStatus('accepted');
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setLocalStatus('declined');
  }, []);

  // Don't render anything after consent is given
  if (status !== 'pending') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl rounded-lg border bg-background p-4 shadow-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden rounded-full bg-primary/10 p-2 sm:block">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{t('title')}</h3>
              <p className="text-sm text-muted-foreground">{t('description')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" onClick={handleDecline}>
              {t('decline')}
            </Button>
            <Button size="sm" onClick={handleAccept}>
              {t('accept')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
