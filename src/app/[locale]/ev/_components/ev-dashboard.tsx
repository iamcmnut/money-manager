'use client';

import { useState } from 'react';
import { ChargingStats } from './charging-stats';
import { PriceComparisonChart } from './price-comparison-chart';
import { ChargingRecordsList } from './charging-records-list';
import { NetworkComparisonCards } from './network-comparison-cards';

export function EVDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRecordChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <ChargingStats refreshKey={refreshKey} />

      <NetworkComparisonCards refreshKey={refreshKey} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PriceComparisonChart refreshKey={refreshKey} />
        <ChargingRecordsList onRecordChange={handleRecordChange} />
      </div>
    </div>
  );
}
