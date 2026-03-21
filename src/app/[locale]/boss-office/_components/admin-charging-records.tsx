'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, User } from 'lucide-react';
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
  error?: string;
}

export function AdminChargingRecords() {
  const t = useTranslations('admin');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/charging-records');
      const data = (await response.json()) as RecordsResponse;

      if (response.ok && data.records) {
        setRecords(data.records);
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
    fetchRecords();
  }, [fetchRecords]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('chargingRecords.loading')}</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="text-sm text-muted-foreground">{t('chargingRecords.noRecords')}</div>;
  }

  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return records.slice(start, start + ITEMS_PER_PAGE);
  }, [records, currentPage]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="space-y-3">
      {paginatedRecords.map((record) => (
        <div
          key={record.id}
          className="rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: record.brandColor || '#6B7280' }}
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
          to: Math.min(startIndex + ITEMS_PER_PAGE, records.length),
          total: records.length,
        })}
      />
    </div>
  );
}
