export interface StatsData {
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
  cheapestNetwork: {
    brandId: string;
    brandName: string;
    avgPricePerKwh: number;
  } | null;
}

export interface BrandData {
  brandId: string;
  brandName: string | null;
  brandColor: string | null;
  brandLogo: string | null;
  brandPhone: string | null;
  brandWebsite: string | null;
  sessions: number;
  totalKwh: number;
  totalCost: number;
  avgPricePerKwh: number;
  isCheapest: boolean;
  priceDiffPercent: number;
}

export interface EVStatsResponse {
  stats?: StatsData;
  brandComparison?: BrandData[];
  monthlyData?: {
    month: string;
    totalKwh: number;
    totalCost: number;
    sessions: number;
  }[];
  error?: string;
}
