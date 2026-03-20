'use client';

import { useTranslations } from 'next-intl';
import { Zap, Wallet, TrendingUp, Hash, Building2, Gauge } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted/50" />
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

  if (!stats) {
    return null;
  }

  const statCards: { icon: LucideIcon; label: string; value: string; subtitle?: string; highlight?: boolean; iconColor?: string }[] = [
    {
      icon: Hash,
      label: t('totalSessions'),
      value: formatNumber(stats.totalSessions),
      iconColor: 'text-muted-foreground',
    },
    {
      icon: Zap,
      label: t('totalKwh'),
      value: `${formatNumber(stats.totalKwh, 2)} kWh`,
      iconColor: 'text-module-ev',
    },
    {
      icon: Wallet,
      label: t('totalCost'),
      value: formatBaht(stats.totalCost),
      highlight: true,
      iconColor: 'text-warning',
    },
    {
      icon: TrendingUp,
      label: t('avgPricePerKwh'),
      value: `${formatBaht(stats.avgPricePerKwh)}/kWh`,
      highlight: true,
      iconColor: 'text-primary',
    },
    {
      icon: Gauge,
      label: t('avgCostPerKm'),
      value: stats.avgCostPerKm > 0 ? `${formatBaht(stats.avgCostPerKm)}/km` : '-',
      subtitle: stats.totalDistanceKm > 0 ? `${formatNumber(stats.totalDistanceKm)} km` : undefined,
      iconColor: 'text-module-ev',
    },
    {
      icon: Building2,
      label: t('mostUsedNetwork'),
      value: stats.mostUsedNetwork?.brandName || '-',
      subtitle: stats.mostUsedNetwork ? `${formatNumber(stats.mostUsedNetwork.sessions)} ${t('sessions')}` : undefined,
      iconColor: 'text-success',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-4 transition-all duration-200 hover:bg-accent/30 hover:shadow-sm hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 text-lg font-bold ${stat.highlight ? 'text-primary' : ''}`}>{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </div>
            <stat.icon className={`h-4 w-4 ${stat.iconColor || 'text-muted-foreground'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
