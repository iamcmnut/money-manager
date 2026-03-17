'use client';

import { ChargingStats } from './charging-stats';
import { PriceComparisonChart } from './price-comparison-chart';
import { NetworkComparisonCards } from './network-comparison-cards';

export function EVDashboard() {
  return (
    <div className="space-y-6">
      <NetworkComparisonCards />

      <ChargingStats />

      <PriceComparisonChart />
    </div>
  );
}
