'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DailyPricesResponse } from './types';

type Range = '30' | '90' | 'all';

export function DailyPriceChart() {
  const t = useTranslations('modules.ev.dailyChart');
  const [data, setData] = useState<DailyPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('90');

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ev/stats/daily-prices?range=${r}`);
      const result = (await response.json()) as DailyPricesResponse;
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || t('failedToLoad'));
      }
    } catch {
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const handleRangeChange = (r: Range) => {
    setRange(r);
  };

  if (loading) {
    return (
      <div>
        <div className="mb-2 h-5 w-44 animate-pulse rounded bg-muted/50" />
        <div className="h-[280px] animate-pulse rounded-lg bg-muted/30" />
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

  if (!data || data.dailyPrices.length < 2) {
    return (
      <div>
        <h3 className="mb-1 font-semibold">{t('title')}</h3>
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-muted-foreground">{t('noData')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t('noDataHint')}</p>
        </div>
      </div>
    );
  }

  const ranges: { value: Range; label: string }[] = [
    { value: '30', label: t('range30') },
    { value: '90', label: t('range90') },
    { value: 'all', label: t('rangeAll') },
  ];

  // Format date for axis: "Mar 5" style
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format date for tooltip: "Mar 5, 2026"
  const formatTooltipDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="mb-1 font-semibold">{t('title')}</h3>
          <p className="text-xs text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg bg-muted/50 p-0.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleRangeChange(r.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.dailyPrices} margin={{ top: 4, right: 8, left: -12, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `฿${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)',
              }}
              labelFormatter={formatTooltipDate}
              formatter={(value: number, name: string) => [
                `฿${value.toFixed(2)}${t('perKwh').replace('฿', '')}`,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            {data.networks.map((network) => (
              <Line
                key={network.name}
                type="monotone"
                dataKey={network.name}
                stroke={network.color}
                strokeWidth={2}
                dot={{ r: 3, fill: network.color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
