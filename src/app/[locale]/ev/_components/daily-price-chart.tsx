'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyPricesResponse, DailyPricePoint } from './types';

type Range = '30' | '90' | 'all';

interface NetworkDailyPriceChartProps {
  networkName: string;
  brandColor: string;
}

export function NetworkDailyPriceChart({ networkName, brandColor }: NetworkDailyPriceChartProps) {
  const t = useTranslations('modules.ev.dailyChart');
  const [data, setData] = useState<DailyPricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>('90');

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/ev/stats/daily-prices?range=${r}`);
      if (!response.ok) {
        setError(true);
        return;
      }
      const result = (await response.json()) as DailyPricesResponse;
      // Filter to only this network's data points
      const filtered = result.dailyPrices
        .filter((point) => point[networkName] !== undefined)
        .map((point) => ({
          date: point.date as string,
          price: point[networkName] as number,
        }));
      setData(filtered);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [networkName]);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const ranges: { value: Range; label: string }[] = [
    { value: '30', label: t('range30') },
    { value: '90', label: t('range90') },
    { value: 'all', label: t('rangeAll') },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (dateStr: React.ReactNode) => {
    if (typeof dateStr !== 'string') return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      {/* Range selector */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium text-muted-foreground">{t('title')}</p>
        <div className="flex gap-0.5 rounded-md bg-muted/50 p-0.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRange(r.value);
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
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

      {/* Chart area */}
      {loading && (
        <div className="h-[100px] animate-pulse rounded bg-muted/30" />
      )}

      {!loading && error && (
        <p className="py-4 text-center text-[10px] text-muted-foreground">{t('failedToLoad')}</p>
      )}

      {!loading && !error && data.length < 2 && (
        <p className="py-4 text-center text-[10px] text-muted-foreground">{t('noData')}</p>
      )}

      {!loading && !error && data.length >= 2 && (
        <div className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 9 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 9 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `฿${v}`}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '11px',
                  padding: '4px 8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,.08)',
                }}
                labelFormatter={formatTooltipDate}
                formatter={(value) => [`฿${Number(value).toFixed(2)}/kWh`, t('title')]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={brandColor}
                strokeWidth={1.5}
                dot={{ r: 2, fill: brandColor, strokeWidth: 0 }}
                activeDot={{ r: 4, strokeWidth: 1.5, stroke: 'hsl(var(--background))' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
