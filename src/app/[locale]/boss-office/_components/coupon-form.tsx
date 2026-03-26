'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface NetworkOption {
  id: string;
  name: string;
}

interface CouponData {
  id: string;
  networkId: string;
  code: string;
  descriptionEn: string | null;
  descriptionTh: string | null;
  conditionEn: string | null;
  conditionTh: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CouponFormProps {
  coupon: CouponData | null;
  networks: NetworkOption[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface ErrorResponse {
  error?: string;
}

function toDateInputValue(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function CouponForm({ coupon, networks, onSuccess, onCancel }: CouponFormProps) {
  const t = useTranslations('admin.coupons');
  const isEditing = !!coupon;

  const [formData, setFormData] = useState({
    networkId: coupon?.networkId || '',
    code: coupon?.code || '',
    descriptionEn: coupon?.descriptionEn || '',
    descriptionTh: coupon?.descriptionTh || '',
    conditionEn: coupon?.conditionEn || '',
    conditionTh: coupon?.conditionTh || '',
    startDate: coupon?.startDate ? toDateInputValue(coupon.startDate) : '',
    endDate: coupon?.endDate ? toDateInputValue(coupon.endDate) : '',
    isActive: coupon?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/coupons/${coupon.id}`
        : '/api/admin/coupons';

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkId: formData.networkId,
          code: formData.code,
          descriptionEn: formData.descriptionEn || null,
          descriptionTh: formData.descriptionTh || null,
          conditionEn: formData.conditionEn || null,
          conditionTh: formData.conditionTh || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isActive: formData.isActive,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = (await response.json()) as ErrorResponse;
        setError(data.error || t('failedToSave'));
      }
    } catch {
      setError(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-background/80 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">
          {isEditing ? t('editCoupon') : t('addCoupon')}
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
            <label className="block text-sm font-medium mb-1">{t('network')}</label>
            <select
              required
              value={formData.networkId}
              onChange={(e) => setFormData({ ...formData, networkId: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">{t('selectNetwork')}</option>
              {networks.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('code')}</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="COUPON-ABC123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('descriptionEn')}</label>
            <input
              type="text"
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Get 300 THB charging credit"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('descriptionTh')}</label>
            <input
              type="text"
              value={formData.descriptionTh}
              onChange={(e) => setFormData({ ...formData, descriptionTh: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="เช่น รับเครดิตชาร์จ 300 บาท"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('conditionEn')}</label>
            <textarea
              value={formData.conditionEn}
              onChange={(e) => setFormData({ ...formData, conditionEn: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              placeholder="e.g. New users only. Min charge 50 kWh."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('conditionTh')}</label>
            <textarea
              value={formData.conditionTh}
              onChange={(e) => setFormData({ ...formData, conditionTh: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              placeholder="เช่น สำหรับผู้ใช้ใหม่เท่านั้น ชาร์จขั้นต่ำ 50 kWh"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('startDate')}</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('endDate')}</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium">{t('isActive')}</label>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
