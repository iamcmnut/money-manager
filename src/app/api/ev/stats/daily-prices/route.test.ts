import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockGetDatabase = vi.fn();
vi.mock('@/lib/server', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockGetKV = vi.fn();
vi.mock('@/lib/cloudflare', () => ({
  getKV: () => mockGetKV(),
}));

vi.mock('@/lib/db/schema', () => ({
  chargingRecords: {
    userId: 'user_id',
    brandId: 'brand_id',
    chargingDatetime: 'charging_datetime',
    costThb: 'cost_thb',
    chargedKwh: 'charged_kwh',
  },
  chargingNetworks: {
    id: 'id',
    name: 'name',
    brandColor: 'brand_color',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
  gte: vi.fn((a: unknown, b: unknown) => ({ type: 'gte', a, b })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: 'sql',
    strings,
    values,
  })),
}));

import { GET } from './route';
import { NextRequest } from 'next/server';

// --- Helpers ---

function createRequest(range?: string): NextRequest {
  const url = range
    ? `http://localhost:3000/api/ev/stats/daily-prices?range=${range}`
    : 'http://localhost:3000/api/ev/stats/daily-prices';
  return new NextRequest(url);
}

function createMockDb(rows: Record<string, unknown>[] = []) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(rows),
            }),
          }),
        }),
      }),
    }),
  };
}

const sampleRows = [
  { date: '2026-03-01', brandId: 'b1', brandName: 'PEA Volta', brandColor: '#00A651', avgPrice: 5.5 },
  { date: '2026-03-01', brandId: 'b2', brandName: 'EA Anywhere', brandColor: '#FF6B00', avgPrice: 6.2 },
  { date: '2026-03-02', brandId: 'b1', brandName: 'PEA Volta', brandColor: '#00A651', avgPrice: 5.3 },
  { date: '2026-03-02', brandId: 'b2', brandName: 'EA Anywhere', brandColor: '#FF6B00', avgPrice: 6.0 },
  { date: '2026-03-03', brandId: 'b1', brandName: 'PEA Volta', brandColor: '#00A651', avgPrice: 5.7 },
];

// --- Tests ---

beforeEach(() => {
  mockAuth.mockReset();
  mockGetDatabase.mockReset();
  mockGetKV.mockReset().mockReturnValue(null);
});

describe('GET /api/ev/stats/daily-prices', () => {
  describe('database availability', () => {
    it('returns 503 when database is not available', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      mockGetDatabase.mockReturnValue(null);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(response.status).toBe(503);
      expect(body.error).toBe('Database not available');
    });
  });

  describe('authentication', () => {
    it('works for unauthenticated users (public data)', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });

    it('works for authenticated users', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });

    it('sets private cache-control for authenticated users', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.headers.get('Cache-Control')).toContain('private');
    });

    it('sets public cache-control for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.headers.get('Cache-Control')).toContain('public');
    });

    it('handles session with no user', async () => {
      mockAuth.mockResolvedValue({ user: null });
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });

    it('handles session with user but no id', async () => {
      mockAuth.mockResolvedValue({ user: { name: 'Test' } });
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });
  });

  describe('date range filtering', () => {
    it('defaults to 90 days when no range param', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
      // The DB query should have been called (we can't easily check the gte filter here
      // but we verify the endpoint doesn't error)
      expect(db.select).toHaveBeenCalled();
    });

    it('accepts range=30', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest('30'));

      expect(response.status).toBe(200);
    });

    it('accepts range=90', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest('90'));

      expect(response.status).toBe(200);
    });

    it('accepts range=all', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest('all'));

      expect(response.status).toBe(200);
    });

    it('falls back to 90 for invalid range values', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest('abc'));

      expect(response.status).toBe(200);
    });
  });

  describe('data pivoting and response shape', () => {
    it('returns correct shape with dailyPrices and networks', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body).toHaveProperty('dailyPrices');
      expect(body).toHaveProperty('networks');
      expect(Array.isArray(body.dailyPrices)).toBe(true);
      expect(Array.isArray(body.networks)).toBe(true);
    });

    it('pivots rows correctly by date with network prices as keys', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      // 3 unique dates in sampleRows
      expect(body.dailyPrices).toHaveLength(3);

      // First date has both networks
      const day1 = body.dailyPrices[0];
      expect(day1.date).toBe('2026-03-01');
      expect(day1['PEA Volta']).toBe(5.5);
      expect(day1['EA Anywhere']).toBe(6.2);

      // Second date has both networks
      const day2 = body.dailyPrices[1];
      expect(day2.date).toBe('2026-03-02');
      expect(day2['PEA Volta']).toBe(5.3);
      expect(day2['EA Anywhere']).toBe(6.0);

      // Third date has only PEA Volta
      const day3 = body.dailyPrices[2];
      expect(day3.date).toBe('2026-03-03');
      expect(day3['PEA Volta']).toBe(5.7);
      expect(day3['EA Anywhere']).toBeUndefined();
    });

    it('extracts unique networks with correct metadata', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.networks).toHaveLength(2);
      expect(body.networks).toContainEqual({ name: 'PEA Volta', color: '#00A651' });
      expect(body.networks).toContainEqual({ name: 'EA Anywhere', color: '#FF6B00' });
    });

    it('returns empty arrays when no data', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.dailyPrices).toEqual([]);
      expect(body.networks).toEqual([]);
    });

    it('uses brandId as fallback when brandName is null', async () => {
      mockAuth.mockResolvedValue(null);
      const rows = [
        { date: '2026-03-01', brandId: 'unknown-brand', brandName: null, brandColor: null, avgPrice: 7.0 },
      ];
      const db = createMockDb(rows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.dailyPrices[0]['unknown-brand']).toBe(7.0);
      expect(body.networks[0].name).toBe('unknown-brand');
    });

    it('uses default color when brandColor is null', async () => {
      mockAuth.mockResolvedValue(null);
      const rows = [
        { date: '2026-03-01', brandId: 'b1', brandName: 'TestNet', brandColor: null, avgPrice: 5.0 },
      ];
      const db = createMockDb(rows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.networks[0].color).toBe('#6B7280');
    });

    it('handles single row correctly', async () => {
      mockAuth.mockResolvedValue(null);
      const rows = [
        { date: '2026-03-01', brandId: 'b1', brandName: 'Solo', brandColor: '#123456', avgPrice: 4.5 },
      ];
      const db = createMockDb(rows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.dailyPrices).toHaveLength(1);
      expect(body.networks).toHaveLength(1);
      expect(body.dailyPrices[0]).toEqual({ date: '2026-03-01', Solo: 4.5 });
    });

    it('handles many networks on same date', async () => {
      mockAuth.mockResolvedValue(null);
      const rows = Array.from({ length: 5 }, (_, i) => ({
        date: '2026-03-01',
        brandId: `b${i}`,
        brandName: `Network${i}`,
        brandColor: `#${String(i).repeat(6)}`,
        avgPrice: 5 + i * 0.5,
      }));
      const db = createMockDb(rows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.dailyPrices).toHaveLength(1);
      expect(body.networks).toHaveLength(5);
      expect(Object.keys(body.dailyPrices[0])).toHaveLength(6); // date + 5 networks
    });

    it('does not duplicate network when same brand appears on multiple dates', async () => {
      mockAuth.mockResolvedValue(null);
      const rows = [
        { date: '2026-03-01', brandId: 'b1', brandName: 'Net', brandColor: '#111', avgPrice: 5 },
        { date: '2026-03-02', brandId: 'b1', brandName: 'Net', brandColor: '#111', avgPrice: 6 },
        { date: '2026-03-03', brandId: 'b1', brandName: 'Net', brandColor: '#111', avgPrice: 7 },
      ];
      const db = createMockDb(rows);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body.networks).toHaveLength(1);
      expect(body.dailyPrices).toHaveLength(3);
    });
  });

  describe('KV caching', () => {
    it('returns cached data from KV when available', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const cachedData = { dailyPrices: [{ date: '2026-01-01', Net: 5 }], networks: [{ name: 'Net', color: '#000' }] };
      const mockKV = {
        get: vi.fn().mockResolvedValue(JSON.stringify(cachedData)),
        put: vi.fn().mockResolvedValue(undefined),
      };
      mockGetKV.mockReturnValue(mockKV);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(body).toEqual(cachedData);
      // DB should NOT have been queried
      expect(db.select).not.toHaveBeenCalled();
    });

    it('queries DB and caches result when KV cache misses', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      };
      mockGetKV.mockReturnValue(mockKV);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
      expect(db.select).toHaveBeenCalled();
      expect(mockKV.put).toHaveBeenCalled();
    });

    it('uses correct cache key with userId and range', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      };
      mockGetKV.mockReturnValue(mockKV);

      await GET(createRequest('30'));

      expect(mockKV.get).toHaveBeenCalledWith('cache:daily-prices:user-123:30');
    });

    it('uses "public" in cache key for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
      };
      mockGetKV.mockReturnValue(mockKV);

      await GET(createRequest('90'));

      expect(mockKV.get).toHaveBeenCalledWith('cache:daily-prices:public:90');
    });

    it('works when KV is not available', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);
      mockGetKV.mockReturnValue(null);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });

    it('does not block on KV put failure', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb(sampleRows);
      mockGetDatabase.mockReturnValue(db);

      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockRejectedValue(new Error('KV write failed')),
      };
      mockGetKV.mockReturnValue(mockKV);

      const response = await GET(createRequest());

      expect(response.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('returns 500 when DB query throws', async () => {
      mockAuth.mockResolvedValue(null);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockRejectedValue(new Error('DB error')),
                }),
              }),
            }),
          }),
        }),
      };
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());
      const body: any = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch daily prices');
    });

    it('propagates error when auth throws (handled by Next.js)', async () => {
      mockAuth.mockRejectedValue(new Error('Auth error'));
      mockGetDatabase.mockReturnValue(createMockDb());

      // auth() is called outside try-catch, matching the existing stats route pattern
      await expect(GET(createRequest())).rejects.toThrow('Auth error');
    });
  });

  describe('cache-control headers', () => {
    it('includes stale-while-revalidate for authenticated users', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=300');
    });

    it('includes s-maxage for public users', async () => {
      mockAuth.mockResolvedValue(null);
      const db = createMockDb([]);
      mockGetDatabase.mockReturnValue(db);

      const response = await GET(createRequest());

      expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
    });

    it('sets private for cached response when authenticated', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'u1' } });
      mockGetDatabase.mockReturnValue(createMockDb());

      const mockKV = {
        get: vi.fn().mockResolvedValue(JSON.stringify({ dailyPrices: [], networks: [] })),
        put: vi.fn(),
      };
      mockGetKV.mockReturnValue(mockKV);

      const response = await GET(createRequest());

      expect(response.headers.get('Cache-Control')).toContain('private');
    });
  });
});
