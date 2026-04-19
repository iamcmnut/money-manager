'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, User, ClipboardCheck } from 'lucide-react';
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
  approvalStatus: string;
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

export function PendingApprovals() {
  const t = useTranslations('admin.pendingApprovals');
  const tAdmin = useTranslations('admin');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/charging-records/pending?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = (await response.json()) as RecordsResponse;

      if (response.ok && data.records) {
        setRecords(data.records);
        setTotalRecords(data.total ?? data.records.length);
      } else {
        setError(data.error || t('failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch pending records:', err);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [fetchRecords, currentPage]);

  const handleAction = async (recordId: string, action: 'approve' | 'reject') => {
    setActionId(recordId);
    setActionType(action);

    try {
      const response = await fetch(`/api/admin/charging-records/${recordId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
        setTotalRecords((prev) => prev - 1);
      } else {
        const data = (await response.json()) as { error?: string };
        alert(data.error || t('failedToApprove'));
      }
    } catch (err) {
      console.error('Failed to update record:', err);
      alert(t('failedToApprove'));
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

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
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{t('title')}</h2>
            <p className="text-xs text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold">{t('title')}</h2>
            <p className="text-xs text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">{t('title')}</h2>
          <p className="text-xs text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('noRecords')}</div>
      ) : (
        <div className="space-y-3">
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
                <div className="flex items-start gap-3">
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
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-module-ev text-white hover:bg-module-ev/90"
                      disabled={actionId === record.id}
                      onClick={() => handleAction(record.id, 'approve')}
                    >
                      {actionId === record.id && actionType === 'approve'
                        ? t('approving')
                        : t('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionId === record.id}
                      onClick={() => handleAction(record.id, 'reject')}
                    >
                      {actionId === record.id && actionType === 'reject'
                        ? t('rejecting')
                        : t('reject')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showingLabel={tAdmin('pagination.showing', {
              from: startIndex + 1,
              to: Math.min(startIndex + ITEMS_PER_PAGE, totalRecords),
              total: totalRecords,
            })}
          />
        </div>
      )}
    </div>
  );
}
