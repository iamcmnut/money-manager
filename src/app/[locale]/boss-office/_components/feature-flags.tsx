'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { type FeatureFlag } from '@/lib/feature-flags';

type FlagsState = Record<FeatureFlag, boolean>;

export function FeatureFlagsPanel() {
  const t = useTranslations('admin');
  const [flags, setFlags] = useState<FlagsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<FeatureFlag | null>(null);

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

  const toggleFlag = async (flag: FeatureFlag) => {
    if (!flags || toggling) return;

    const newValue = !flags[flag];
    setToggling(flag);

    // Optimistic update
    setFlags((prev) => (prev ? { ...prev, [flag]: newValue } : prev));

    try {
      const response = await fetch('/api/admin/flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag, enabled: newValue }),
      });

      if (!response.ok) {
        // Revert on failure
        setFlags((prev) => (prev ? { ...prev, [flag]: !newValue } : prev));
      }
    } catch {
      // Revert on error
      setFlags((prev) => (prev ? { ...prev, [flag]: !newValue } : prev));
    } finally {
      setToggling(null);
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
          <button
            type="button"
            role="switch"
            aria-checked={flags[flag]}
            disabled={toggling === flag}
            onClick={() => toggleFlag(flag)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 ${
              flags[flag] ? 'bg-success' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                flags[flag] ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
