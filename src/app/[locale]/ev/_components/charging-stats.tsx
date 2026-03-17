'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, Wallet, TrendingUp, Hash, Building2, Gauge } from 'lucide-react';

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      icon: Hash,
      label: t('totalSessions'),
      value: stats.totalSessions.toString(),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      label: t('totalKwh'),
      value: `${stats.totalKwh.toFixed(2)} kWh`,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Wallet,
      label: t('totalCost'),
      value: `฿${stats.totalCost.toFixed(2)}`,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: TrendingUp,
      label: t('avgPricePerKwh'),
      value: `฿${stats.avgPricePerKwh.toFixed(2)}/kWh`,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Gauge,
      label: t('avgCostPerKm'),
      value: stats.avgCostPerKm > 0 ? `฿${stats.avgCostPerKm.toFixed(2)}/km` : '-',
      subtitle: stats.totalDistanceKm > 0 ? `${stats.totalDistanceKm.toLocaleString()} km` : undefined,
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Building2,
      label: t('mostUsedNetwork'),
      value: stats.mostUsedNetwork?.brandName || '-',
      subtitle: stats.mostUsedNetwork ? `${stats.mostUsedNetwork.sessions} ${t('sessions')}` : undefined,
      color: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-xl border bg-background/50 p-4 backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-lg font-bold">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
