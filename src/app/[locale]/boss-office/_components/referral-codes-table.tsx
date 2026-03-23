'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Globe, Flag } from 'lucide-react';
import { ReferralCodeForm } from './referral-code-form';

interface NetworkData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  brandColor: string | null;
  referralCode: string | null;
  referralCaptionEn: string | null;
  referralCaptionTh: string | null;
}

interface NetworksResponse {
  networks?: NetworkData[];
  error?: string;
}

interface ErrorResponse {
  error?: string;
}

export function ReferralCodesTable() {
  const t = useTranslations('admin.referralCodes');
  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<{
    networkId: string;
    networkName: string;
    code: string;
    captionEn: string | null;
    captionTh: string | null;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchNetworks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/charging-networks');
      const data = (await response.json()) as NetworksResponse;

      if (response.ok && data.networks) {
        setNetworks(data.networks);
      } else {
        setError(data.error || t('failedToLoad'));
      }
    } catch {
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  const removeReferralCode = async (networkId: string) => {
    if (!confirm(t('confirmRemove'))) return;

    setRemovingId(networkId);

    try {
      const response = await fetch(`/api/admin/charging-networks/${networkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: null,
          referralCaptionEn: null,
          referralCaptionTh: null,
        }),
      });

      if (response.ok) {
        fetchNetworks();
      } else {
        const data = (await response.json()) as ErrorResponse;
        alert(data.error || t('failedToSave'));
      }
    } catch {
      alert(t('failedToSave'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCode(null);
    fetchNetworks();
  };

  const networksWithCodes = networks.filter((n) => n.referralCode);

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('loading')}</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditingCode(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {showForm && (
        <ReferralCodeForm
          referralCode={editingCode}
          networks={networks.map((n) => ({
            id: n.id,
            name: n.name,
            brandColor: n.brandColor,
            referralCode: n.referralCode,
          }))}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCode(null);
          }}
        />
      )}

      {networksWithCodes.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('noReferralCodes')}</div>
      ) : (
        <div className="space-y-3">
          {networksWithCodes.map((network) => (
            <div
              key={network.id}
              className="flex items-start justify-between rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
            >
              <div className="flex items-start gap-3 min-w-0">
                {network.logo ? (
                  <Image
                    src={network.logo}
                    alt={network.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white font-bold text-sm"
                    style={{ backgroundColor: network.brandColor || '#6B7280' }}
                  >
                    {network.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium">{network.name}</p>
                  <code className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {network.referralCode}
                  </code>
                  <div className="mt-2 space-y-1">
                    {network.referralCaptionEn && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{network.referralCaptionEn}</span>
                      </div>
                    )}
                    {network.referralCaptionTh && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Flag className="h-3 w-3 shrink-0" />
                        <span className="truncate">{network.referralCaptionTh}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingCode({
                      networkId: network.id,
                      networkName: network.name,
                      code: network.referralCode!,
                      captionEn: network.referralCaptionEn,
                      captionTh: network.referralCaptionTh,
                    });
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removingId === network.id}
                  onClick={() => removeReferralCode(network.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
