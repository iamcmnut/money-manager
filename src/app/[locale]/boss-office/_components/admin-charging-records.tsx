'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, User, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber, formatBaht } from '@/lib/format';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

interface RecordData {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  brandId: string;
  brandName: string | null;
  brandColor: string | null;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  avgUnitPrice: number | null;
  mileageKm: number | null;
  notes: string | null;
  createdAt: string | null;
}

interface RecordsResponse {
  records?: RecordData[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export function AdminChargingRecords() {
  const t = useTranslations('admin');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/charging-records?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = (await response.json()) as RecordsResponse;

      if (response.ok && data.records) {
        setRecords(data.records);
        setTotalRecords(data.total ?? data.records.length);
      } else {
        setError(data.error || t('chargingRecords.failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError(t('chargingRecords.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [fetchRecords, currentPage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportRecords = async () => {
    setExporting(true);
    try {
      const allRecords: RecordData[] = [];
      let page = 1;
      const batchLimit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/admin/charging-records?page=${page}&limit=${batchLimit}`);
        const data = (await response.json()) as RecordsResponse;
        if (data.records) {
          allRecords.push(...data.records);
          hasMore = allRecords.length < (data.total ?? 0);
          page++;
        } else {
          hasMore = false;
        }
      }

      const headers = ['Date', 'User', 'Email', 'Network', 'kWh', 'Cost (THB)', 'Avg Price (THB/kWh)', 'Mileage (km)', 'Notes'];
      const rows = allRecords.map((r) => [
        r.chargingDatetime,
        r.userName || '',
        r.userEmail || '',
        r.brandName || r.brandId,
        r.chargedKwh,
        r.costThb,
        r.avgUnitPrice ?? '',
        r.mileageKm ?? '',
        r.notes || '',
      ]);
      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ev-charging-records-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export records:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('chargingRecords.loading')}</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="text-sm text-muted-foreground">{t('chargingRecords.noRecords')}</div>;
  }

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={exportRecords}
          disabled={exporting}
        >
          <Download className="mr-1 h-4 w-4" />
          {exporting ? t('exporting') : t('export')}
        </Button>
      </div>
      {records.map((record) => (
        <div
          key={record.id}
          className="rounded-xl border bg-background/50 p-4 transition-all hover:bg-background/80 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: record.brandColor || 'hsl(var(--muted-foreground))' }}
              >
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{record.brandName || record.brandId}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(record.chargingDatetime)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {record.userName || record.userEmail}
                </div>
                {record.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{record.notes}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-success">
                {formatNumber(record.chargedKwh, 2)} kWh
              </p>
              <p className="text-sm text-muted-foreground">
                {formatBaht(record.costThb)}
              </p>
              {record.avgUnitPrice && (
                <p className="text-xs text-muted-foreground">
                  {formatBaht(record.avgUnitPrice)}/kWh
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        showingLabel={t('pagination.showing', {
          from: startIndex + 1,
          to: Math.min(startIndex + ITEMS_PER_PAGE, totalRecords),
          total: totalRecords,
        })}
      />
    </div>
  );
}
