'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, TrendingUp, Zap, Wallet } from 'lucide-react';
import { formatNumber, formatBaht } from '@/lib/format';
import type { BrandData } from './types';

interface PriceComparisonChartProps {
  brandComparison?: BrandData[];
  loading: boolean;
  error: string | null;
}

export function PriceComparisonChart({ brandComparison, loading, error }: PriceComparisonChartProps) {
  const t = useTranslations('modules.ev.chart');
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger bar animations after mount
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-5 h-5 w-48 animate-pulse rounded bg-muted/50" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted/50" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted/50" />
                <div className="h-7 animate-pulse rounded-md bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
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

  if (!brandComparison || brandComparison.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border text-muted-foreground">
        {t('noData')}
      </div>
    );
  }

  const sorted = [...brandComparison].sort(
    (a, b) => a.avgPricePerKwh - b.avgPricePerKwh
  );

  const maxPrice = Math.max(...sorted.map((b) => b.avgPricePerKwh));

  const handleToggle = (brandId: string) => {
    setExpandedId((prev) => (prev === brandId ? null : brandId));
  };

  return (
    <div ref={containerRef} className="rounded-lg border bg-card p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-semibold">{t('title')}</h3>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {t('tapToCompare')}
        </p>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">{t('description')}</p>

      <div className="space-y-3">
        {sorted.map((brand, index) => {
          const barPercent = maxPrice > 0
            ? (brand.avgPricePerKwh / maxPrice) * 100
            : 0;
          const isExpanded = expandedId === brand.brandId;
          const price = Math.round(brand.avgPricePerKwh * 100) / 100;

          return (
            <button
              key={brand.brandId}
              type="button"
              onClick={() => handleToggle(brand.brandId)}
              className={`
                group w-full rounded-lg border p-3 text-left
                transition-all duration-200 ease-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${brand.isCheapest
                  ? 'border-success/30 bg-success-muted/40 hover:bg-success-muted/60'
                  : 'border-transparent bg-muted/30 hover:bg-muted/50'
                }
                ${isExpanded ? 'ring-1 ring-border' : ''}
              `}
              aria-expanded={isExpanded}
            >
              {/* Main row */}
              <div className="flex items-center gap-3">
                {/* Brand avatar */}
                {brand.brandLogo ? (
                  <img
                    src={brand.brandLogo}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: brand.brandColor || '#6B7280' }}
                  >
                    {brand.brandName?.charAt(0) || '?'}
                  </div>
                )}

                {/* Name + bar area */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {brand.brandName || brand.brandId}
                    </span>
                    {brand.isCheapest && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 text-[10px] font-medium text-success-foreground">
                        <Trophy className="h-2.5 w-2.5" />
                        {t('cheapest')}
                      </span>
                    )}
                    {!brand.isCheapest && brand.priceDiffPercent > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-warning">
                        <TrendingUp className="h-2.5 w-2.5" />
                        +{formatNumber(brand.priceDiffPercent, 1)}%
                      </span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted/50">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{
                        width: mounted ? `${Math.max(barPercent, 8)}%` : '0%',
                        backgroundColor: brand.brandColor || 'hsl(var(--primary))',
                        opacity: 0.75,
                        transitionDelay: `${index * 80}ms`,
                      }}
                    />
                    {/* Price label over bar */}
                    <div className="absolute inset-0 flex items-center px-2.5">
                      <span
                        className="text-xs font-semibold drop-shadow-sm"
                        style={{
                          color: mounted && barPercent > 30 ? '#fff' : 'hsl(var(--foreground))',
                          transitionDelay: `${index * 80 + 300}ms`,
                        }}
                      >
                        {formatBaht(price)}{t('perKwh')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session count */}
                <div className="shrink-0 text-right">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatNumber(brand.sessions)}
                  </span>
                  <p className="text-[10px] text-muted-foreground/70">
                    {t('sessions')}
                  </p>
                </div>
              </div>

              {/* Expanded detail */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/50 pt-3 sm:grid-cols-3">
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
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
