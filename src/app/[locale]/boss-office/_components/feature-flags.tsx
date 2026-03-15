'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { type FeatureFlag } from '@/lib/feature-flags';

type FlagsState = Record<FeatureFlag, boolean>;

export function FeatureFlagsPanel() {
  const t = useTranslations('admin');
  const [flags, setFlags] = useState<FlagsState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/admin/flags');
      if (response.ok) {
        const data = (await response.json()) as FlagsState;
        setFlags(data);
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('loadingFlags')}</div>;
  }

  if (!flags) {
    return <div className="text-sm text-muted-foreground">{t('failedToLoadFlags')}</div>;
  }

  return (
    <div className="space-y-3">
      {(Object.keys(flags) as FeatureFlag[]).map((flag) => (
        <div key={flag} className="flex items-center justify-between rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80">
          <span className="font-medium">{t(`flags.${flag}`)}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              flags[flag]
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {flags[flag] ? t('enabled') : t('disabled')}
          </span>
        </div>
      ))}

      <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        {t('flagsEnvNote')}
      </p>
    </div>
  );
}
