'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface NetworkData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string | null;
  phone: string | null;
  brandColor: string | null;
}

interface ChargingNetworkFormProps {
  network: NetworkData | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ErrorResponse {
  error?: string;
}

export function ChargingNetworkForm({ network, onSuccess, onCancel }: ChargingNetworkFormProps) {
  const t = useTranslations('admin');
  const isEditing = !!network;

  const [formData, setFormData] = useState({
    name: network?.name || '',
    slug: network?.slug || '',
    website: network?.website || '',
    phone: network?.phone || '',
    brandColor: network?.brandColor || '#6B7280',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = isEditing
      ? `/api/admin/charging-networks/${network.id}`
      : '/api/admin/charging-networks';

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          website: formData.website || null,
          phone: formData.phone || null,
          brandColor: formData.brandColor || null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = (await response.json()) as ErrorResponse;
        setError(data.error || t('evNetworks.failedToSave'));
      }
    } catch (err) {
      console.error('Failed to save network:', err);
      setError(t('evNetworks.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="rounded-xl border bg-background/80 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          {isEditing ? t('evNetworks.editNetwork') : t('evNetworks.addNetwork')}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">{t('evNetworks.name')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: isEditing ? formData.slug : generateSlug(e.target.value),
                });
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="PTT EV Station PluZ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('evNetworks.slug')}</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="ptt-ev-station-pluz"
              disabled={isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('evNetworks.website')}</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('evNetworks.phone')}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="02-123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('evNetworks.brandColor')}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="h-10 w-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={formData.brandColor}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="#00A651"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('evNetworks.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {saving ? t('evNetworks.saving') : t('evNetworks.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
