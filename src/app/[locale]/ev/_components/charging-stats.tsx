'use client';

import { useTranslations } from 'next-intl';
import { Zap, Wallet, TrendingUp, Hash, Building2, Gauge } from 'lucide-react';
import { formatNumber, formatBaht } from '@/lib/format';
import type { StatsData } from './types';

interface ChargingStatsProps {
  stats?: StatsData;
  loading: boolean;
  error: string | null;
}

export function ChargingStats({ stats, loading, error }: ChargingStatsProps) {
  const t = useTranslations('modules.ev.stats');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-muted/50" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 animate-pulse rounded-lg border bg-muted/50" />
          <div className="h-24 animate-pulse rounded-lg border bg-muted/50" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
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

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{t('title')}</h3>

      {/* Primary stats — the numbers users care about most */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{t('avgPricePerKwh')}</p>
          </div>
          <p className="mt-3 text-2xl font-bold text-primary tabular-nums">
            {formatBaht(stats.avgPricePerKwh)}/kWh
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Wallet className="h-4 w-4 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground">{t('totalCost')}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {formatBaht(stats.totalCost)}
          </p>
        </div>
      </div>

      {/* Secondary stats — supporting context, compact row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5">
          <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t('totalSessions')}</p>
            <p className="text-sm font-semibold tabular-nums">{formatNumber(stats.totalSessions)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5">
          <Zap className="h-3.5 w-3.5 shrink-0 text-module-ev" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t('totalKwh')}</p>
            <p className="text-sm font-semibold tabular-nums">{formatNumber(stats.totalKwh, 1)} kWh</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5">
          <Gauge className="h-3.5 w-3.5 shrink-0 text-module-ev" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t('avgCostPerKm')}</p>
            <p className="text-sm font-semibold tabular-nums">
              {stats.avgCostPerKm > 0 ? `${formatBaht(stats.avgCostPerKm)}/km` : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2.5">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t('mostUsedNetwork')}</p>
            <p className="truncate text-sm font-semibold">{stats.mostUsedNetwork?.brandName || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
