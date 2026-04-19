'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Trophy, TrendingUp, Zap, Wallet, ChevronDown, Phone, ExternalLink, Tag } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatNumber, formatBaht } from '@/lib/format';
import { sanitizeUrl } from '@/lib/sanitize-url';
import { NetworkDailyPriceChart } from './daily-price-chart';
import type { BrandData } from './types';

interface PriceComparisonChartProps {
  brandComparison?: BrandData[];
  loading: boolean;
  error: string | null;
  showDailyPriceChart?: boolean;
  showCoupon?: boolean;
  couponNetworkSlugs?: string[];
}

const rankStyles = [
  'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400',
  'border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400',
];

export function PriceComparisonChart({ brandComparison, loading, error, showDailyPriceChart = true, showCoupon = true, couponNetworkSlugs = [] }: PriceComparisonChartProps) {
  const t = useTranslations('modules.ev.chart');
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Auto-expand the cheapest card so users discover the expand pattern
  useEffect(() => {
    if (mounted && !hasAutoExpanded && brandComparison && brandComparison.length > 0) {
      const cheapest = [...brandComparison].sort((a, b) => a.avgPricePerKwh - b.avgPricePerKwh)[0];
      const timer = setTimeout(() => {
        setExpandedId(cheapest.brandId);
        setHasAutoExpanded(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [mounted, hasAutoExpanded, brandComparison]);

  if (loading) {
    return (
      <div>
        <div className="mb-5 h-5 w-48 animate-pulse rounded bg-muted/50" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted/50" />
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted/50" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted/50" />
                <div className="h-6 animate-pulse rounded-md bg-muted/50" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!brandComparison || brandComparison.length === 0) {
    return (
      <div>
        <h3 className="mb-1 font-semibold">{t('title')}</h3>
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <Zap className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-muted-foreground">{t('noData')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t('noDataHint')}</p>
        </div>
      </div>
    );
  }

  const sorted = [...brandComparison].sort(
    (a, b) => a.avgPricePerKwh - b.avgPricePerKwh
  );

  const handleToggle = (brandId: string) => {
    setExpandedId((prev) => (prev === brandId ? null : brandId));
  };

  return (
    <div>
      <h3 className="mb-1 font-semibold">{t('title')}</h3>
      <p className="mb-5 text-xs text-muted-foreground">{t('description')}</p>

      <div className="space-y-3">
        {sorted.map((brand, index) => {
          const isExpanded = expandedId === brand.brandId;
          const price = Math.round(brand.avgPricePerKwh * 100) / 100;
          const rank = index + 1;

          return (
            <button
              key={brand.brandId}
              type="button"
              onClick={() => handleToggle(brand.brandId)}
              className={`
                group w-full overflow-hidden rounded-lg border p-3 text-left
                transition-colors duration-200 ease-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${brand.isCheapest
                  ? 'border-success/30 bg-success-muted/40 hover:bg-success-muted/60'
                  : 'border-transparent bg-muted/30 hover:bg-muted/50'
                }
                ${isExpanded ? 'ring-1 ring-border' : ''}
              `}
              style={{ borderLeftWidth: '3px', borderLeftColor: brand.brandColor || 'hsl(var(--muted-foreground))' }}
              aria-expanded={isExpanded}
            >
              {/* Main row */}
              <div className="flex items-center gap-3">
                {/* Rank badge */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    rank <= 3
                      ? rankStyles[rank - 1]
                      : 'text-muted-foreground'
                  }`}
                  aria-label={`Rank ${rank}`}
                >
                  {rank}
                </div>

                {/* Brand avatar */}
                {brand.brandLogo ? (
                  <Image
                    src={brand.brandLogo}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: brand.brandColor || 'hsl(var(--muted-foreground))' }}
                  >
                    {brand.brandName?.charAt(0) || '?'}
                  </div>
                )}

                {/* Name + code badge */}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {brand.brandName || brand.brandId}
                  </span>

                  {/* Code badge */}
                  {showCoupon && brand.brandSlug && couponNetworkSlugs.includes(brand.brandSlug) && (
                    <Link
                      href={`/ev/coupon/${brand.brandSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 active:scale-[0.97]"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {t('coupon')}
                    </Link>
                  )}
                </div>

                {/* Price + session count + chevron */}
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatBaht(price)}{t('perKwh')}
                    </span>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatNumber(brand.sessions)} {t('sessions')}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 motion-reduce:transition-none ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded detail */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 border-t border-border/50 pt-3">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-module-ev" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{t('totalEnergy')}</p>
                          <p className="text-sm font-medium tabular-nums">
                            {formatNumber(brand.totalKwh, 1)} kWh
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-warning" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{t('totalSpent')}</p>
                          <p className="text-sm font-medium tabular-nums">
                            {formatBaht(brand.totalCost)}
                          </p>
                        </div>
                      </div>
                      {!brand.isCheapest && brand.priceDiffPercent > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-warning" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">{t('moreExpensive')}</p>
                            <p className="text-sm font-medium tabular-nums">
                              +{formatNumber(brand.priceDiffPercent, 1)}%
                            </p>
                          </div>
                        </div>
                      )}
                      {brand.isCheapest && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3.5 w-3.5 text-success" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">{t('avgPrice')}</p>
                            <p className="text-sm font-medium text-success tabular-nums">
                              {t('cheapest')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact info */}
                    {(brand.brandPhone || brand.brandWebsite) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {brand.brandPhone && (
                          <a
                            href={`tel:${brand.brandPhone.replace(/\s/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {brand.brandPhone}
                          </a>
                        )}
                        {brand.brandWebsite && sanitizeUrl(brand.brandWebsite) && (
                          <a
                            href={sanitizeUrl(brand.brandWebsite)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('website')}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Coupon badge */}
                    {showCoupon && brand.brandSlug && couponNetworkSlugs.includes(brand.brandSlug) && (
                      <div className="mt-3">
                        <Link
                          href={`/ev/coupon/${brand.brandSlug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {t('hasCoupon')}
                        </Link>
                      </div>
                    )}

                    {/* Daily price trend chart */}
                    {showDailyPriceChart && isExpanded && (
                      <NetworkDailyPriceChart
                        networkName={brand.brandName || brand.brandId}
                        brandColor={brand.brandColor || 'hsl(var(--muted-foreground))'}
                      />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
