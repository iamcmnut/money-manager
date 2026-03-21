'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Zap, Upload, X, FileSpreadsheet, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChargingRecordForm } from './charging-record-form';
import { formatNumber, formatBaht } from '@/lib/format';

interface RecordData {
  id: string;
  brandId: string;
  brandName: string | null;
  brandColor: string | null;
  brandLogo: string | null;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  avgUnitPrice: number | null;
  chargingPowerKw: number | null;
  chargingFinishDatetime: string | null;
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

interface ChargingRecordsListProps {
  onRecordChange?: () => void;
}

interface ErrorResponse {
  error?: string;
}

interface ImportResponse {
  success?: boolean;
  imported?: number;
  total?: number;
  errors?: { row: number; error: string }[];
  hasMoreErrors?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 10;

export function ChargingRecordsList({ onRecordChange }: ChargingRecordsListProps) {
  const t = useTranslations('modules.ev.history');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<RecordData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = useCallback(async (page = 1) => {
    try {
      const response = await fetch(`/api/ev/records?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = (await response.json()) as RecordsResponse;

      if (response.ok && data.records) {
        setRecords(data.records);
        setTotalRecords(data.total ?? data.records.length);
      } else {
        setError(data.error || t('failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(currentPage);
  }, [fetchRecords, currentPage]);

  const deleteRecord = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/ev/records/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        onRecordChange?.();
      } else {
        const data = (await response.json()) as ErrorResponse;
        alert(data.error || t('failedToDelete'));
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
      alert(t('failedToDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchRecords(currentPage);
    onRecordChange?.();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ev/records/import', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ImportResponse;

      if (response.ok && result.success) {
        setImportResult(result);
        fetchRecords(currentPage);
        onRecordChange?.();
      } else {
        setImportResult({ error: result.error || t('import.failed') });
      }
    } catch (err) {
      console.error('Failed to import:', err);
      setImportResult({ error: t('import.failed') });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    return <div className="text-sm text-muted-foreground">{t('loading')}</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
            disabled={importing}
          />
          <a
            href="/templates/ev-charging-import-sample.xlsx"
            download="ev-charging-import-sample.xlsx"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Download className="h-3 w-3" />
            {t('import.downloadSample')}
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-1 h-4 w-4" />
            {importing ? t('import.importing') : t('import.button')}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingRecord(null);
              setShowForm(true);
            }}
            className=""
          >
            <Plus className="mr-1 h-4 w-4" />
            {t('add')}
          </Button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div
          className={`rounded-xl border p-4 ${
            importResult.error
              ? 'bg-destructive/5 border-destructive/20 text-destructive'
              : 'bg-success-muted border-success/20 text-success'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 mt-0.5" />
              <div>
                {importResult.error ? (
                  <p className="font-medium">{importResult.error}</p>
                ) : (
                  <>
                    <p className="font-medium">
                      {t('import.success', { count: importResult.imported ?? 0, total: importResult.total ?? 0 })}
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-warning">{t('import.warnings')}:</p>
                        <ul className="mt-1 list-disc list-inside">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>
                              {t('import.rowError', { row: err.row })}: {err.error}
                            </li>
                          ))}
                        </ul>
                        {importResult.hasMoreErrors && (
                          <p className="mt-1 text-muted-foreground">{t('import.moreErrors')}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setImportResult(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <ChargingRecordForm
          record={editingRecord}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {records.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('noRecords')}</p>
          <p className="text-sm mt-1">{t('noRecordsHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

            return (
              <>
                {records.map((record) => (
            <div
              key={record.id}
              className="rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {record.brandLogo ? (
                    <Image
                      src={record.brandLogo}
                      alt={record.brandName || ''}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: record.brandColor || '#6B7280' }}
                    >
                      <Zap className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{record.brandName || record.brandId}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.chargingDatetime)}
                    </p>
                    {record.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{record.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingRecord(record);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5"
                      disabled={deletingId === record.id}
                      onClick={() => deleteRecord(record.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                        if (totalPages <= 5) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          if (currentPage > 3) pages.push('ellipsis-start');
                          for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                            pages.push(i);
                          }
                          if (currentPage < totalPages - 2) pages.push('ellipsis-end');
                          pages.push(totalPages);
                        }
                        return pages.map((page) =>
                          typeof page === 'string' ? (
                            <span key={page} className="px-1 text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          )
                        );
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <span className="ml-2 text-sm text-muted-foreground">
                      {t('pagination.showing', {
                        from: startIndex + 1,
                        to: Math.min(startIndex + ITEMS_PER_PAGE, totalRecords),
                        total: totalRecords,
                      })}
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
