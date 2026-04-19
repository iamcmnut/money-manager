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

const mockInvalidateCouponCache = vi.fn();
vi.mock('@/lib/coupon-cache', () => ({
  invalidateCouponCache: (...args: unknown[]) => mockInvalidateCouponCache(...args),
}));

vi.mock('@/lib/db/schema', () => ({
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
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  chargingNetworks: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    logo: 'logo',
    brandColor: 'brand_color',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
  desc: vi.fn((col: unknown) => ({ type: 'desc', col })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({
    type: 'sql',
    strings,
    values,
  })),
}));

import { GET, POST } from './route';

// --- Helpers ---

function createRequest(url = 'http://localhost:3000/api/admin/coupons', options?: RequestInit): Request {
  return new Request(url, options);
}

function createMockDb(couponRows: Record<string, unknown>[] = [], total = 0) {
  const mockLimit = vi.fn().mockReturnValue({
    offset: vi.fn().mockResolvedValue(couponRows),
  });
  const mockOrderBy = vi.fn().mockReturnValue({
    limit: mockLimit,
  });
  const mockWhere = vi.fn().mockReturnValue({
    orderBy: mockOrderBy,
  });

  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
        where: vi.fn().mockResolvedValue([{ count: total }]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'coupon-123', networkId: 'network-1' }]),
      }),
    }),
  };
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
};

const userSession = {
  user: { id: 'user-1', email: 'user@example.com', role: 'user' },
};

// --- GET Tests ---

describe('GET /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await GET(createRequest());
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await GET(createRequest());
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      mockAuth.mockResolvedValue(userSession);
      const response = await GET(createRequest());
      expect(response.status).toBe(403);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await GET(createRequest());
      expect(response.status).toBe(503);
    });
  });

  describe('Pagination', () => {
    it('should use default pagination (page=1, limit=20)', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
    });

    it('should respect custom page and limit', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/admin/coupons?page=2&limit=5'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(2);
      expect(body.limit).toBe(5);
    });

    it('should clamp limit to max 100', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/admin/coupons?limit=500'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.limit).toBe(100);
    });

    it('should clamp limit to min 1', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/admin/coupons?limit=0'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.limit).toBe(1);
    });

    it('should clamp page to min 1', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/admin/coupons?page=-1'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should return coupons filtered by networkId', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const coupons = [{ id: 'c1', networkId: 'n1', code: 'SAVE10' }];
      const db = createMockDb(coupons, 1);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/admin/coupons?networkId=n1'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.coupons).toEqual(coupons);
      expect(body.total).toBe(1);
    });
  });

  describe('Successful response', () => {
    it('should return coupons with total count', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const coupons = [
        { id: 'c1', networkId: 'n1', code: 'SAVE10' },
        { id: 'c2', networkId: 'n1', code: 'SAVE20' },
      ];
      const db = createMockDb(coupons, 2);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.coupons).toEqual(coupons);
      expect(body.total).toBe(2);
    });

    it('should return empty array when no coupons exist', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.coupons).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockRejectedValue(new Error('DB error')),
                  }),
                }),
              }),
            }),
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(500);
      const body: any = await response.json();
      expect(body.error).toBe('Failed to fetch coupons');
    });
  });
});

// --- POST Tests ---

describe('POST /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateCouponCache.mockResolvedValue(undefined);
  });

  const validBody = {
    networkId: 'network-1',
    code: 'SAVE10',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
  };

  function createPostRequest(body: unknown): Request {
    return createRequest('http://localhost:3000/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      mockAuth.mockResolvedValue(userSession);
      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(403);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(503);
    });
  });

  describe('Input validation', () => {
    it('should return 400 when networkId is missing', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, networkId: '' }));
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toContain('required');
    });

    it('should return 400 when code is missing', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, code: '' }));
      expect(response.status).toBe(400);
    });

    it('should return 400 when startDate is missing', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, startDate: '' }));
      expect(response.status).toBe(400);
    });

    it('should return 400 when endDate is missing', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, endDate: '' }));
      expect(response.status).toBe(400);
    });

    it('should return 400 when startDate is invalid', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, startDate: 'not-a-date' }));
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toContain('Invalid date');
    });

    it('should return 400 when endDate is invalid', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({ ...validBody, endDate: 'not-a-date' }));
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toContain('Invalid date');
    });

    it('should return 400 when startDate is after endDate', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({
        ...validBody,
        startDate: '2026-12-31T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z',
      }));
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toContain('Start date must be before end date');
    });

    it('should return 400 when startDate equals endDate', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createPostRequest({
        ...validBody,
        startDate: '2026-06-15T00:00:00Z',
        endDate: '2026-06-15T00:00:00Z',
      }));
      expect(response.status).toBe(400);
    });
  });

  describe('Successful creation', () => {
    it('should return 201 with created coupon', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.coupon).toBeDefined();
      expect(body.coupon.id).toBe('coupon-123');
    });

    it('should generate ID with coupon- prefix', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest(validBody));

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.id).toMatch(/^coupon-\d+-[a-z0-9]+$/);
    });

    it('should handle optional description and condition fields', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest({
        ...validBody,
        descriptionEn: 'Save 10%',
        descriptionTh: 'ลด 10%',
        conditionEn: 'Min 100 kWh',
        conditionTh: 'ขั้นต่ำ 100 kWh',
      }));

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.descriptionEn).toBe('Save 10%');
      expect(valuesArg.descriptionTh).toBe('ลด 10%');
      expect(valuesArg.conditionEn).toBe('Min 100 kWh');
      expect(valuesArg.conditionTh).toBe('ขั้นต่ำ 100 kWh');
    });

    it('should set optional fields to null when not provided', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest(validBody));

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.descriptionEn).toBeNull();
      expect(valuesArg.descriptionTh).toBeNull();
      expect(valuesArg.conditionEn).toBeNull();
      expect(valuesArg.conditionTh).toBeNull();
    });

    it('should default isActive to true', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest(validBody));

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.isActive).toBe(true);
    });

    it('should allow setting isActive to false', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest({ ...validBody, isActive: false }));

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.isActive).toBe(false);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate coupon cache after successful creation', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest(validBody));

      expect(mockInvalidateCouponCache).toHaveBeenCalledWith('network-1');
      expect(mockInvalidateCouponCache).toHaveBeenCalledTimes(1);
    });

    it('should not invalidate cache when creation fails', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('Unexpected error')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await POST(createPostRequest(validBody));

      expect(mockInvalidateCouponCache).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 400 for foreign key constraint violation', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Invalid network selected');
    });

    it('should return 500 for unexpected database errors', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('Unexpected error')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(createPostRequest(validBody));
      expect(response.status).toBe(500);
      const body: any = await response.json();
      expect(body.error).toBe('Failed to create coupon');
    });
  });
});
