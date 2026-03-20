'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChargingStats } from './charging-stats';
import { PriceComparisonChart } from './price-comparison-chart';
import { NetworkComparisonCards } from './network-comparison-cards';
import type { EVStatsResponse } from './types';

export function EVDashboard() {
  const [data, setData] = useState<EVStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ev/stats');
      const result = (await response.json()) as EVStatsResponse;

      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Failed to fetch EV stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <PriceComparisonChart
        brandComparison={data?.brandComparison}
        loading={loading}
        error={error}
      />

      <NetworkComparisonCards
        brandComparison={data?.brandComparison}
        loading={loading}
        error={error}
      />

      <ChargingStats
        stats={data?.stats}
        loading={loading}
        error={error}
      />
    </div>
  );
}
