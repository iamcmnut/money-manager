'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, Wallet, TrendingUp, Hash, Building2, Gauge } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsData {
  totalSessions: number;
  totalKwh: number;
  totalCost: number;
  avgPricePerKwh: number;
  totalDistanceKm: number;
  avgCostPerKm: number;
  mostUsedNetwork: {
    brandId: string;
    brandName: string;
    sessions: number;
  } | null;
}

interface StatsResponse {
  stats?: StatsData;
  error?: string;
}

export function ChargingStats() {
  const t = useTranslations('modules.ev.stats');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/ev/stats');
      const data = (await response.json()) as StatsResponse;

      if (response.ok && data.stats) {
        setStats(data.stats);
      } else {
        setError(data.error || t('failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
      value: stats.totalSessions.toString(),
      iconColor: 'text-muted-foreground',
    },
    {
      icon: Zap,
      label: t('totalKwh'),
      value: `${stats.totalKwh.toFixed(2)} kWh`,
      iconColor: 'text-module-ev',
    },
    {
      icon: Wallet,
      label: t('totalCost'),
      value: `฿${stats.totalCost.toFixed(2)}`,
      highlight: true,
      iconColor: 'text-warning',
    },
    {
      icon: TrendingUp,
      label: t('avgPricePerKwh'),
      value: `฿${stats.avgPricePerKwh.toFixed(2)}/kWh`,
      highlight: true,
      iconColor: 'text-primary',
    },
    {
      icon: Gauge,
      label: t('avgCostPerKm'),
      value: stats.avgCostPerKm > 0 ? `฿${stats.avgCostPerKm.toFixed(2)}/km` : '-',
      subtitle: stats.totalDistanceKm > 0 ? `${stats.totalDistanceKm.toLocaleString()} km` : undefined,
      iconColor: 'text-module-ev',
    },
    {
      icon: Building2,
      label: t('mostUsedNetwork'),
      value: stats.mostUsedNetwork?.brandName || '-',
      subtitle: stats.mostUsedNetwork ? `${stats.mostUsedNetwork.sessions} ${t('sessions')}` : undefined,
      iconColor: 'text-success',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30"
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
