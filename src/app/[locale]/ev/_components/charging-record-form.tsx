'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PhotoUpload } from '@/components/photo-upload';
import { formatNumber } from '@/lib/format';

interface NetworkData {
  id: string;
  name: string;
  brandColor: string | null;
}

interface NetworksResponse {
  networks?: NetworkData[];
  error?: string;
}

interface ErrorResponse {
  error?: string;
}

interface UserCarOption {
  id: string;
  brandName: string | null;
  modelName: string | null;
  nickname: string | null;
  isDefault: boolean;
}

interface RecordData {
  id: string;
  brandId: string;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  chargingPowerKw: number | null;
  chargingFinishDatetime: string | null;
  mileageKm: number | null;
  notes: string | null;
  userCarId?: string | null;
  isShared?: boolean;
  photoKey?: string | null;
}

interface ChargingRecordFormProps {
  record: RecordData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChargingRecordForm({ record, open, onOpenChange, onSuccess }: ChargingRecordFormProps) {
  const t = useTranslations('modules.ev.form');
  const isEditing = !!record;

  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [cars, setCars] = useState<UserCarOption[]>([]);
  const [defaultVisibility, setDefaultVisibility] = useState<'public' | 'private'>('private');
  const [formData, setFormData] = useState({
    brandId: record?.brandId || '',
    userCarId: record?.userCarId ?? '',
    chargingDatetime: record?.chargingDatetime
      ? new Date(record.chargingDatetime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    chargedKwh: record ? record.chargedKwh.toString() : '',
    costThb: record ? record.costThb.toString() : '',
    chargingPowerKw: record?.chargingPowerKw ? record.chargingPowerKw.toString() : '',
    chargingFinishDatetime: record?.chargingFinishDatetime
      ? new Date(record.chargingFinishDatetime).toISOString().slice(0, 16)
      : '',
    mileageKm: record?.mileageKm?.toString() || '',
    notes: record?.notes || '',
    isShared: record?.isShared ?? null,
    photoKey: record?.photoKey ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShared = formData.isShared ?? defaultVisibility === 'public';

  // Reset form when record changes (opening for a different record or new)
  useEffect(() => {
    if (open) {
      setFormData({
        brandId: record?.brandId || '',
        userCarId: record?.userCarId ?? '',
        chargingDatetime: record?.chargingDatetime
          ? new Date(record.chargingDatetime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        chargedKwh: record ? record.chargedKwh.toString() : '',
        costThb: record ? record.costThb.toString() : '',
        chargingPowerKw: record?.chargingPowerKw ? record.chargingPowerKw.toString() : '',
        chargingFinishDatetime: record?.chargingFinishDatetime
          ? new Date(record.chargingFinishDatetime).toISOString().slice(0, 16)
          : '',
        mileageKm: record?.mileageKm?.toString() || '',
        notes: record?.notes || '',
        isShared: record?.isShared ?? null,
        photoKey: record?.photoKey ?? null,
      });
      setError(null);
    }
  }, [open, record]);

  // Fetch user cars + default visibility once when dialog opens
  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [carsRes, profileRes] = await Promise.all([
          fetch('/api/me/cars').then((r) => r.json() as Promise<{ cars: UserCarOption[] }>),
          fetch('/api/me/profile').then(
            (r) => r.json() as Promise<{ profile: { defaultRecordVisibility: 'public' | 'private' } }>,
          ),
        ]);
        setCars(carsRes.cars);
        setDefaultVisibility(profileRes.profile.defaultRecordVisibility);
        if (!record && !formData.userCarId) {
          const defaultCar = carsRes.cars.find((c) => c.isDefault) ?? carsRes.cars[0];
          if (defaultCar) setFormData((prev) => ({ ...prev, userCarId: defaultCar.id }));
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  useEffect(() => {
    if (!open) return;
    const fetchNetworks = async () => {
      try {
        const response = await fetch('/api/ev/networks');
        const data = (await response.json()) as NetworksResponse;
        if (data.networks) {
          const fetchedNetworks = data.networks;
          setNetworks(fetchedNetworks);
          if (!record && fetchedNetworks.length > 0 && !formData.brandId) {
            setFormData((prev) => ({ ...prev, brandId: fetchedNetworks[0].id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch networks:', err);
      }
    };
    fetchNetworks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = isEditing ? `/api/ev/records/${record.id}` : '/api/ev/records';

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: formData.brandId,
          userCarId: formData.userCarId || undefined,
          chargingDatetime: formData.chargingDatetime,
          chargedKwh: parseFloat(formData.chargedKwh),
          costThb: parseFloat(formData.costThb),
          chargingPowerKw: formData.chargingPowerKw ? parseFloat(formData.chargingPowerKw) : null,
          chargingFinishDatetime: formData.chargingFinishDatetime || null,
          mileageKm: formData.mileageKm ? parseInt(formData.mileageKm) : null,
          notes: formData.notes || null,
          isShared,
          photoKey: formData.photoKey,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        onSuccess();
      } else {
        const data = (await response.json()) as ErrorResponse;
        setError(data.error || t('failedToSave'));
      }
    } catch (err) {
      console.error('Failed to save record:', err);
      setError(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const avgUnitPrice = useMemo(() => {
    const kWh = parseFloat(formData.chargedKwh) || 0;
    const cost = parseFloat(formData.costThb) || 0;
    return kWh > 0 ? formatNumber(cost / kWh, 2) : '0.00';
  }, [formData.chargedKwh, formData.costThb]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editRecord') : t('addRecord')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? t('editRecord') : t('addRecord')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded-lg">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">{t('brand')}</label>
              <select
                required
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('datetime')}</label>
              <input
                type="datetime-local"
                required
                value={formData.chargingDatetime}
                onChange={(e) => setFormData({ ...formData, chargingDatetime: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('chargedKwh')}</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.chargedKwh}
                onChange={(e) => setFormData({ ...formData, chargedKwh: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="25.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('costThb')}</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.costThb}
                onChange={(e) => setFormData({ ...formData, costThb: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="150.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('avgUnitPrice')}</label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <span>฿{avgUnitPrice}/kWh</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('chargingPowerKw')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.chargingPowerKw}
                onChange={(e) => setFormData({ ...formData, chargingPowerKw: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('chargingFinishDatetime')}</label>
              <input
                type="datetime-local"
                value={formData.chargingFinishDatetime}
                onChange={(e) => setFormData({ ...formData, chargingFinishDatetime: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('mileageKm')}</label>
              <input
                type="number"
                min="0"
                value={formData.mileageKm}
                onChange={(e) => setFormData({ ...formData, mileageKm: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="45000"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('notes')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
                placeholder={t('notesPlaceholder')}
              />
            </div>

            {cars.length > 1 && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Car</label>
                <select
                  value={formData.userCarId}
                  onChange={(e) => setFormData({ ...formData, userCarId: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brandName ?? ''} {c.modelName ?? ''}
                      {c.nickname ? ` · ${c.nickname}` : ''}
                      {c.isDefault ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Slip photo (optional)</label>
              <PhotoUpload
                value={formData.photoKey}
                onChange={(key) => setFormData({ ...formData, photoKey: key })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Adding a slip photo is +5 EXP when shared records are approved.
              </p>
            </div>

            <div className="sm:col-span-2 rounded-lg border border-border p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={isShared}
                  onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                />
                <span className="text-sm">
                  <span className="font-medium">Share to public stats</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    (default: {defaultVisibility})
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Public records contribute anonymized averages to /ev once an admin approves them, and earn EXP.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
