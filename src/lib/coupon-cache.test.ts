import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockGetKV = vi.fn();
vi.mock('./cloudflare', () => ({
  getKV: () => mockGetKV(),
}));

const mockGetDatabase = vi.fn();
vi.mock('./server', () => ({
  getDatabase: () => mockGetDatabase(),
}));

vi.mock('./db/schema', () => ({
  coupons: {
    id: 'id',
    networkId: 'network_id',
    code: 'code',
    descriptionEn: 'description_en',
    descriptionTh: 'description_th',
    conditionEn: 'condition_en',
    conditionTh: 'condition_th',
    startDate: 'start_date',
    endDate: 'end_date',
    isActive: 'is_active',
  },
  chargingNetworks: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    logo: 'logo',
    brandColor: 'brand_color',
    website: 'website',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: 'sql',
    strings,
    values,
  })),
}));

import { invalidateCouponCache, getCachedNetworkCoupons } from './coupon-cache';

// --- Helpers ---

function createMockKV(data: Record<string, string> = {}) {
  const store = new Map(Object.entries(data));
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  };
}

// --- invalidateCouponCache ---

describe('invalidateCouponCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing when KV is not available', async () => {
    mockGetKV.mockReturnValue(null);
    await invalidateCouponCache('network-1');
    // No error thrown
  });

  it('should do nothing when database is not available', async () => {
    const kv = createMockKV();
    mockGetKV.mockReturnValue(kv);
    mockGetDatabase.mockReturnValue(null);
    await invalidateCouponCache('network-1');
    expect(kv.delete).not.toHaveBeenCalled();
  });

  it('should delete slug-specific cache and active-networks cache', async () => {
    const kv = createMockKV();
    mockGetKV.mockReturnValue(kv);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ slug: 'ea-anywhere' }]),
          }),
        }),
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    await invalidateCouponCache('network-1');

    expect(kv.delete).toHaveBeenCalledWith('cache:coupons:ea-anywhere');
    expect(kv.delete).toHaveBeenCalledWith('cache:coupons:active-networks');
    expect(kv.delete).toHaveBeenCalledTimes(2);
  });

  it('should only delete active-networks cache when network slug not found', async () => {
    const kv = createMockKV();
    mockGetKV.mockReturnValue(kv);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    await invalidateCouponCache('network-1');

    expect(kv.delete).toHaveBeenCalledWith('cache:coupons:active-networks');
    expect(kv.delete).toHaveBeenCalledTimes(1);
  });

  it('should not throw when DB query fails', async () => {
    const kv = createMockKV();
    mockGetKV.mockReturnValue(kv);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    await expect(invalidateCouponCache('network-1')).resolves.toBeUndefined();
  });
});

// --- getCachedNetworkCoupons ---

describe('getCachedNetworkCoupons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data when available in KV', async () => {
    const cachedData = {
      network: { id: 'n1', name: 'EA', slug: 'ea', logo: null, brandColor: null, website: null },
      coupons: [{ id: 'c1', code: 'SAVE10', descriptionEn: null, descriptionTh: null, conditionEn: null, conditionTh: null, startDate: '2026-01-01', endDate: '2026-12-31' }],
    };
    const kv = createMockKV({ 'cache:coupons:ea': JSON.stringify(cachedData) });
    mockGetKV.mockReturnValue(kv);

    const result = await getCachedNetworkCoupons('ea');

    expect(result).toEqual(cachedData);
    expect(kv.get).toHaveBeenCalledWith('cache:coupons:ea');
  });

  it('should return empty result when database is not available and no cache', async () => {
    mockGetKV.mockReturnValue(null);
    mockGetDatabase.mockReturnValue(null);

    const result = await getCachedNetworkCoupons('ea');

    expect(result).toEqual({ network: null, coupons: [] });
  });

  it('should return empty result when network not found in DB', async () => {
    mockGetKV.mockReturnValue(null);

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    const result = await getCachedNetworkCoupons('nonexistent');

    expect(result).toEqual({ network: null, coupons: [] });
  });

  it('should query DB and cache result when KV cache misses', async () => {
    const kv = createMockKV(); // empty cache
    mockGetKV.mockReturnValue(kv);

    const network = { id: 'n1', name: 'EA', slug: 'ea', logo: null, brandColor: '#00AA00', website: 'https://ea.co.th' };
    const dbCoupons = [
      { id: 'c1', code: 'SAVE10', descriptionEn: 'Save 10%', descriptionTh: null, conditionEn: null, conditionTh: null, startDate: 1704067200, endDate: 1735689600 },
    ];

    // First select: network lookup
    const mockNetworkSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([network]),
        }),
      }),
    });

    // Second select: coupons lookup
    const mockCouponsSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(dbCoupons),
      }),
    });

    let selectCallCount = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) return mockNetworkSelect();
        return mockCouponsSelect();
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    const result = await getCachedNetworkCoupons('ea');

    expect(result.network).toEqual(network);
    expect(result.coupons).toHaveLength(1);
    expect(result.coupons[0].code).toBe('SAVE10');
    // Verify it was cached
    expect(kv.put).toHaveBeenCalledWith(
      'cache:coupons:ea',
      expect.any(String),
      { expirationTtl: 300 }
    );
  });

  it('should handle KV parse errors gracefully and fall through to DB', async () => {
    const kv = {
      get: vi.fn().mockResolvedValue('invalid-json{{{'),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    mockGetKV.mockReturnValue(kv);

    const network = { id: 'n1', name: 'EA', slug: 'ea', logo: null, brandColor: null, website: null };

    let selectCallCount = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([network]),
              }),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    const result = await getCachedNetworkCoupons('ea');

    expect(result.network).toEqual(network);
    expect(result.coupons).toEqual([]);
  });

  it('should skip caching when KV is not available', async () => {
    mockGetKV.mockReturnValue(null);

    const network = { id: 'n1', name: 'EA', slug: 'ea', logo: null, brandColor: null, website: null };

    let selectCallCount = 0;
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([network]),
              }),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      }),
    };
    mockGetDatabase.mockReturnValue(mockDb);

    const result = await getCachedNetworkCoupons('ea');

    expect(result.network).toEqual(network);
    // No error thrown, just no caching
  });
});
