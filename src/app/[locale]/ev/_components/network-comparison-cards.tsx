'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, ExternalLink, Trophy, TrendingUp } from 'lucide-react';
import { formatNumber, formatBaht } from '@/lib/format';

interface BrandData {
  brandId: string;
  brandName: string | null;
  brandColor: string | null;
  brandLogo: string | null;
  brandPhone: string | null;
  brandWebsite: string | null;
  sessions: number;
  totalKwh: number;
  totalCost: number;
  avgPricePerKwh: number;
  isCheapest: boolean;
  priceDiffPercent: number;
}

interface StatsResponse {
  brandComparison?: BrandData[];
  stats?: {
    cheapestNetwork?: {
      brandId: string;
      brandName: string;
      avgPricePerKwh: number;
    } | null;
  };
  error?: string;
}

export function NetworkComparisonCards() {
  const t = useTranslations('modules.ev.networks');
  const [data, setData] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/ev/stats');
      const result = (await response.json()) as StatsResponse;

      if (response.ok && result.brandComparison) {
        // Sort by avgPricePerKwh (cheapest first)
        const sorted = [...result.brandComparison].sort(
          (a, b) => a.avgPricePerKwh - b.avgPricePerKwh
        );
        setData(sorted);
      } else {
        setError(result.error || t('failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch network data:', err);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noData')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((brand, index) => (
          <div
            key={brand.brandId}
            className={`relative rounded-lg border p-4 transition-colors hover:bg-accent/30 ${
              brand.isCheapest
                ? 'border-success/30 bg-success-muted/50'
                : 'bg-card'
            }`}
          >
            {/* Cheapest badge */}
            {brand.isCheapest && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                <Trophy className="h-3 w-3" />
                {t('cheapest')}
              </div>
            )}

            {/* Rank number */}
            <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
              {index + 1}
            </div>

            {/* Brand header */}
            <div className="mt-6 flex items-center gap-3">
              {brand.brandLogo ? (
                <img
                  src={brand.brandLogo}
                  alt={brand.brandName || ''}
                  className="h-12 w-12 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                  style={{ backgroundColor: brand.brandColor || '#6B7280' }}
                >
                  {brand.brandName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h3 className="font-semibold">{brand.brandName}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(brand.sessions)} {t('sessions')}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatBaht(brand.avgPricePerKwh)}
                </span>
                <span className="text-sm text-muted-foreground">/kWh</span>
              </div>

              {/* Price difference */}
              {!brand.isCheapest && brand.priceDiffPercent > 0 && (
                <div className="mt-1 flex items-center gap-1 text-sm text-warning">
                  <TrendingUp className="h-3 w-3" />
                  <span>+{formatNumber(brand.priceDiffPercent, 1)}% {t('moreExpensive')}</span>
                </div>
              )}
            </div>

            {/* Contact info */}
            <div className="mt-3 flex flex-wrap gap-2">
              {brand.brandPhone && (
                <a
                  href={`tel:${brand.brandPhone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                >
                  <Phone className="h-3 w-3" />
                  {brand.brandPhone}
                </a>
              )}
              {brand.brandWebsite && (
                <a
                  href={brand.brandWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs hover:bg-muted/80"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('website')}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
