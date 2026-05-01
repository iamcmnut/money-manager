'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChargingStats } from './charging-stats';
import { PriceComparisonChart } from './price-comparison-chart';
import { MonthFilter } from './month-filter';
import type { EVStatsResponse } from './types';

interface EVDashboardProps {
  showDailyPriceChart: boolean;
  showCoupon: boolean;
}

interface ActiveNetworksResponse {
  slugs?: string[];
}

export function EVDashboard({ showDailyPriceChart, showCoupon }: EVDashboardProps) {
  const [data, setData] = useState<EVStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponNetworkSlugs, setCouponNetworkSlugs] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const availableMonths = useMemo(
    () => data?.monthlyData?.map((m) => m.month) ?? [],
    [data?.monthlyData]
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const statsUrl = selectedMonth
          ? `/api/ev/stats?month=${selectedMonth}`
          : '/api/ev/stats';

        const [statsResponse, couponResponse] = await Promise.all([
          fetch(statsUrl, { signal }),
          showCoupon ? fetch('/api/ev/coupons/active-networks', { signal }) : Promise.resolve(null),
        ]);

        if (signal.aborted) return;

        const result = (await statsResponse.json()) as EVStatsResponse;

        if (statsResponse.ok) {
          setData(result);
        } else {
          setError(result.error || 'Failed to load stats');
        }

        if (couponResponse?.ok) {
          const couponData = (await couponResponse.json()) as ActiveNetworksResponse;
          setCouponNetworkSlugs(couponData.slugs || []);
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error('Failed to fetch EV stats:', err);
        setError('Failed to load stats');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    fetchStats();
    return () => controller.abort();
  }, [showCoupon, selectedMonth]);

  return (
    <div className="space-y-4 md:space-y-6" aria-busy={loading}>
      {availableMonths.length > 0 && (
        <div className="flex justify-end">
          <MonthFilter
            months={availableMonths}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      )}

      <PriceComparisonChart
        brandComparison={data?.brandComparison}
        loading={loading}
        error={error}
        showDailyPriceChart={showDailyPriceChart}
        showCoupon={showCoupon}
        couponNetworkSlugs={couponNetworkSlugs}
      />

      <ChargingStats
        stats={data?.stats}
        loading={loading}
        error={error}
      />
    </div>
  );
}
