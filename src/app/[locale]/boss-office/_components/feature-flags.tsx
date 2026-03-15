'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { type FeatureFlag } from '@/lib/feature-flags';

type FlagsState = Record<FeatureFlag, boolean>;

interface SaveResponse {
  success?: boolean;
  persisted?: boolean;
  error?: string;
}

export function FeatureFlagsPanel() {
  const t = useTranslations('admin');
  const [flags, setFlags] = useState<FlagsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const toggleFlag = (flag: FeatureFlag) => {
    if (!flags) return;
    setFlags((prev) => (prev ? { ...prev, [flag]: !prev[flag] } : null));
    setMessage(null);
  };

  const saveFlags = async () => {
    if (!flags) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });

      const data = (await response.json()) as SaveResponse;

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.persisted ? t('flagsSavedKV') : t('flagsUpdatedLocal'),
        });
      } else {
        setMessage({ type: 'error', text: data.error || t('failedToSave') });
      }
    } catch (error) {
      console.error('Failed to save flags:', error);
      setMessage({ type: 'error', text: t('failedToSaveFlags') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('loadingFlags')}</div>;
  }

  if (!flags) {
    return <div className="text-sm text-muted-foreground">{t('failedToLoadFlags')}</div>;
  }

  return (
    <div className="space-y-4">
      {(Object.keys(flags) as FeatureFlag[]).map((flag) => (
        <div key={flag} className="flex items-center justify-between">
          <span className="text-sm">{t(`flags.${flag}`)}</span>
          <Button
            variant={flags[flag] ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleFlag(flag)}
          >
            {flags[flag] ? t('enabled') : t('disabled')}
          </Button>
        </div>
      ))}

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <div className="pt-4">
        <Button onClick={saveFlags} disabled={saving} className="w-full">
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
