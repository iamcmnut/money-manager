'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BrandData {
  brandId: string;
  brandName: string | null;
  brandColor: string | null;
  sessions: number;
  totalKwh: number;
  totalCost: number;
  avgPricePerKwh: number;
}

interface StatsResponse {
  brandComparison?: BrandData[];
  error?: string;
}

export function PriceComparisonChart() {
  const t = useTranslations('modules.ev.chart');
  const [data, setData] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/ev/stats');
      const result = (await response.json()) as StatsResponse;

      if (response.ok && result.brandComparison) {
        setData(result.brandComparison);
      } else {
        setError(result.error || t('failedToLoad'));
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
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
      <div className="h-64 animate-pulse rounded-xl border bg-muted/50" />
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-muted/20 text-muted-foreground">
        {t('noData')}
      </div>
    );
  }

  const chartData = data
    .map((item) => ({
      name: item.brandName || item.brandId,
      avgPrice: Math.round(item.avgPricePerKwh * 100) / 100,
      color: item.brandColor || '#6B7280',
      sessions: item.sessions,
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice);

  return (
    <div className="rounded-xl border bg-background/50 p-4 backdrop-blur-sm">
      <h3 className="mb-4 font-semibold">{t('title')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              tickFormatter={(value) => `฿${value}`}
              domain={[0, 'dataMax + 1']}
              tick={{ fontSize: 11 }}
              width={45}
            />
            <Tooltip
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [`฿${numValue.toFixed(2)}/kWh`, t('avgPrice')];
              }}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="avgPrice" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}
