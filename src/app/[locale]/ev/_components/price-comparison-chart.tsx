'use client';

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
import { formatNumber, formatBaht } from '@/lib/format';
import type { BrandData } from './types';

interface PriceComparisonChartProps {
  brandComparison?: BrandData[];
  loading: boolean;
  error: string | null;
}

export function PriceComparisonChart({ brandComparison, loading, error }: PriceComparisonChartProps) {
  const t = useTranslations('modules.ev.chart');

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-lg border bg-muted/50" />
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
      <div className="flex h-64 items-center justify-center rounded-lg border text-muted-foreground">
        {t('noData')}
      </div>
    );
  }

  const chartData = brandComparison
    .map((item) => ({
      name: item.brandName || item.brandId,
      avgPrice: Math.round(item.avgPricePerKwh * 100) / 100,
      color: item.brandColor || '#6B7280',
      sessions: item.sessions,
    }))
    .sort((a, b) => a.avgPrice - b.avgPrice);

  return (
    <div className="rounded-lg border bg-card p-4">
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
              tickFormatter={(value) => formatBaht(value)}
              domain={[0, 'dataMax + 1']}
              tick={{ fontSize: 11 }}
              width={45}
            />
            <Tooltip
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return [`${formatBaht(numValue)}/kWh`, t('avgPrice')];
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
