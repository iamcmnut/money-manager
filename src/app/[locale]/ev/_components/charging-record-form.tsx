'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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

interface RecordData {
  id: string;
  brandId: string;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  mileageKm: number | null;
  notes: string | null;
}

interface ChargingRecordFormProps {
  record: RecordData | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChargingRecordForm({ record, onSuccess, onCancel }: ChargingRecordFormProps) {
  const t = useTranslations('modules.ev.form');
  const isEditing = !!record;

  const [networks, setNetworks] = useState<NetworkData[]>([]);
  const [formData, setFormData] = useState({
    brandId: record?.brandId || '',
    chargingDatetime: record?.chargingDatetime
      ? new Date(record.chargingDatetime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    chargedKwh: record ? (record.chargedKwh / 100).toString() : '',
    costThb: record ? (record.costThb / 100).toString() : '',
    mileageKm: record?.mileageKm?.toString() || '',
    notes: record?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [record]);

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
          chargingDatetime: formData.chargingDatetime,
          chargedKwh: parseFloat(formData.chargedKwh),
          costThb: parseFloat(formData.costThb),
          mileageKm: formData.mileageKm ? parseInt(formData.mileageKm) : null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
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
    <div className="rounded-xl border bg-background/80 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          {isEditing ? t('editRecord') : t('addRecord')}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className=""
          >
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
