'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X, Upload, Trash2, Loader2 } from 'lucide-react';

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

interface UploadResponse {
  url?: string;
  error?: string;
}

export function ChargingNetworkForm({ network, onSuccess, onCancel }: ChargingNetworkFormProps) {
  const t = useTranslations('admin');
  const isEditing = !!network;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: network?.name || '',
    slug: network?.slug || '',
    website: network?.website || '',
    phone: network?.phone || '',
    brandColor: network?.brandColor || '#6B7280',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(network?.logo || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoRemoved(false);

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setLogoRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'logos');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as UploadResponse;

    if (!response.ok || !data.url) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = isEditing
      ? `/api/admin/charging-networks/${network.id}`
      : '/api/admin/charging-networks';

    const payload: Record<string, string | null> = {
      name: formData.name,
      slug: formData.slug,
      website: formData.website || null,
      phone: formData.phone || null,
      brandColor: formData.brandColor || null,
    };

    try {
      if (logoFile) {
        setUploading(true);
        payload.logo = await uploadLogo(logoFile);
        setUploading(false);
      } else if (logoRemoved) {
        payload.logo = null;
      }

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      setUploading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const isBusy = saving || uploading;

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

        <div>
          <label className="block text-sm font-medium mb-2">{t('evNetworks.logo')}</label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-16 rounded-xl object-cover border"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground"
              >
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-1 h-3 w-3" />
                {logoPreview ? t('evNetworks.changeLogo') : t('evNetworks.uploadLogo')}
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t('evNetworks.removeLogo')}
                </Button>
              )}
            </div>
          </div>
        </div>

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
            disabled={isBusy}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {isBusy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {uploading ? t('evNetworks.uploading') : saving ? t('evNetworks.saving') : t('evNetworks.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
