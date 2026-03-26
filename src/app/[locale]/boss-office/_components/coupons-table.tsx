'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { CouponForm } from './coupon-form';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

interface CouponData {
  id: string;
  networkId: string;
  networkName: string | null;
  networkSlug: string | null;
  networkLogo: string | null;
  networkBrandColor: string | null;
  code: string;
  descriptionEn: string | null;
  descriptionTh: string | null;
  conditionEn: string | null;
  conditionTh: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface NetworkOption {
  id: string;
  name: string;
}

interface CouponsResponse {
  coupons?: CouponData[];
  total?: number;
  error?: string;
}

interface NetworksResponse {
  networks?: NetworkOption[];
  error?: string;
}

interface ErrorResponse {
  error?: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

export function CouponsTable() {
  const t = useTranslations('admin');
  const [couponsList, setCouponsList] = useState<CouponData[]>([]);
  const [networks, setNetworks] = useState<NetworkOption[]>([]);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCoupons = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/coupons?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = (await response.json()) as CouponsResponse;

      if (response.ok && data.coupons) {
        setCouponsList(data.coupons);
        setTotalCoupons(data.total ?? data.coupons.length);
      } else {
        setError(data.error || t('coupons.failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      setError(t('coupons.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchNetworks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/charging-networks');
      const data = (await response.json()) as NetworksResponse;
      if (response.ok && data.networks) {
        setNetworks(data.networks);
      }
    } catch (err) {
      console.error('Failed to fetch networks:', err);
    }
  }, []);

  useEffect(() => {
    fetchCoupons(currentPage);
    fetchNetworks();
  }, [fetchCoupons, fetchNetworks, currentPage]);

  const deleteCoupon = async (id: string) => {
    if (!confirm(t('coupons.confirmDelete'))) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCoupons(currentPage);
      } else {
        const data = (await response.json()) as ErrorResponse;
        alert(data.error || t('coupons.failedToDelete'));
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      alert(t('coupons.failedToDelete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCoupon(null);
    fetchCoupons(currentPage);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('coupons.loading')}</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  const totalPages = Math.ceil(totalCoupons / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditingCoupon(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Plus className="mr-1 h-4 w-4" />
          {t('coupons.add')}
        </Button>
      </div>

      {showForm && (
        <CouponForm
          coupon={editingCoupon ? {
            id: editingCoupon.id,
            networkId: editingCoupon.networkId,
            code: editingCoupon.code,
            descriptionEn: editingCoupon.descriptionEn,
            descriptionTh: editingCoupon.descriptionTh,
            conditionEn: editingCoupon.conditionEn,
            conditionTh: editingCoupon.conditionTh,
            startDate: editingCoupon.startDate,
            endDate: editingCoupon.endDate,
            isActive: editingCoupon.isActive,
          } : null}
          networks={networks}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCoupon(null);
          }}
        />
      )}

      {couponsList.length === 0 ? (
        <div className="text-sm text-muted-foreground">{t('coupons.noCoupons')}</div>
      ) : (
        <div className="space-y-3">
          {couponsList.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                {coupon.networkLogo ? (
                  <Image
                    src={coupon.networkLogo}
                    alt={coupon.networkName || ''}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm"
                    style={{ backgroundColor: coupon.networkBrandColor || '#6B7280' }}
                  >
                    {(coupon.networkName || '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{coupon.networkName}</p>
                    <code className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {coupon.code}
                    </code>
                    {coupon.isActive ? (
                      isExpired(coupon.endDate) ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          {t('coupons.expired')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('coupons.active')}
                        </span>
                      )
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {t('coupons.inactive')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(coupon.startDate)} — {formatDate(coupon.endDate)}
                  </div>
                  {coupon.descriptionEn && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{coupon.descriptionEn}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === coupon.id}
                  onClick={() => deleteCoupon(coupon.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showingLabel={t('pagination.showing', {
              from: startIndex + 1,
              to: Math.min(startIndex + ITEMS_PER_PAGE, totalCoupons),
              total: totalCoupons,
            })}
          />
        </div>
      )}
    </div>
  );
}
