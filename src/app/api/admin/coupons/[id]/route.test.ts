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
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
}));

import { PATCH, DELETE } from './route';

// --- Helpers ---

function createRequest(url = 'http://localhost:3000/api/admin/coupons/c1', options?: RequestInit): Request {
  return new Request(url, options);
}

function createParams(id = 'coupon-1'): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
};

const userSession = {
  user: { id: 'user-1', email: 'user@example.com', role: 'user' },
};

// --- PATCH Tests ---

describe('PATCH /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateCouponCache.mockResolvedValue(undefined);
  });

  function createPatchRequest(body: unknown): Request {
    return createRequest('http://localhost:3000/api/admin/coupons/c1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await PATCH(createPatchRequest({ code: 'NEW' }), createParams());
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await PATCH(createPatchRequest({ code: 'NEW' }), createParams());
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      mockAuth.mockResolvedValue(userSession);
      const response = await PATCH(createPatchRequest({ code: 'NEW' }), createParams());
      expect(response.status).toBe(403);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await PATCH(createPatchRequest({ code: 'NEW' }), createParams());
      expect(response.status).toBe(503);
    });
  });

  describe('Input validation', () => {
    it('should return 400 when startDate is invalid', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue({
        update: vi.fn(),
      });

      const response = await PATCH(createPatchRequest({ startDate: 'not-a-date' }), createParams());
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid start date');
    });

    it('should return 400 when endDate is invalid', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue({
        update: vi.fn(),
      });

      const response = await PATCH(createPatchRequest({ endDate: 'not-a-date' }), createParams());
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('Invalid end date');
    });
  });

  describe('Successful update', () => {
    it('should update coupon and return updated data', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const updatedCoupon = { id: 'coupon-1', networkId: 'n1', code: 'UPDATED' };
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([updatedCoupon]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(createPatchRequest({ code: 'UPDATED' }), createParams());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.coupon).toEqual(updatedCoupon);
    });

    it('should return 404 when coupon not found', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(createPatchRequest({ code: 'UPDATED' }), createParams());
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Coupon not found');
    });

    it('should update all supported fields', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const updatedCoupon = { id: 'coupon-1', networkId: 'n1', code: 'NEW' };
      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedCoupon]),
        }),
      });
      const db = {
        update: vi.fn().mockReturnValue({ set: mockSet }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await PATCH(createPatchRequest({
        code: 'NEW',
        networkId: 'n2',
        descriptionEn: 'English desc',
        descriptionTh: 'Thai desc',
        conditionEn: 'Condition EN',
        conditionTh: 'Condition TH',
        isActive: false,
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-12-31T23:59:59Z',
      }), createParams());

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.code).toBe('NEW');
      expect(setArg.networkId).toBe('n2');
      expect(setArg.descriptionEn).toBe('English desc');
      expect(setArg.descriptionTh).toBe('Thai desc');
      expect(setArg.conditionEn).toBe('Condition EN');
      expect(setArg.conditionTh).toBe('Condition TH');
      expect(setArg.isActive).toBe(false);
      expect(setArg.startDate).toBeInstanceOf(Date);
      expect(setArg.endDate).toBeInstanceOf(Date);
      expect(setArg.updatedAt).toBeInstanceOf(Date);
    });

    it('should set description/condition to null when empty string provided', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const updatedCoupon = { id: 'coupon-1', networkId: 'n1' };
      const mockSet = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedCoupon]),
        }),
      });
      const db = {
        update: vi.fn().mockReturnValue({ set: mockSet }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await PATCH(createPatchRequest({
        descriptionEn: '',
        descriptionTh: '',
        conditionEn: '',
        conditionTh: '',
      }), createParams());

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.descriptionEn).toBeNull();
      expect(setArg.descriptionTh).toBeNull();
      expect(setArg.conditionEn).toBeNull();
      expect(setArg.conditionTh).toBeNull();
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache after successful update', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const updatedCoupon = { id: 'coupon-1', networkId: 'n1' };
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([updatedCoupon]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await PATCH(createPatchRequest({ code: 'UPDATED' }), createParams());

      expect(mockInvalidateCouponCache).toHaveBeenCalledWith('n1');
      expect(mockInvalidateCouponCache).toHaveBeenCalledTimes(1);
    });

    it('should not invalidate cache when coupon not found', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await PATCH(createPatchRequest({ code: 'UPDATED' }), createParams());

      expect(mockInvalidateCouponCache).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(createPatchRequest({ code: 'UPDATED' }), createParams());
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to update coupon');
    });
  });
});

// --- DELETE Tests ---

describe('DELETE /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateCouponCache.mockResolvedValue(undefined);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      mockAuth.mockResolvedValue(userSession);
      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(403);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(503);
    });
  });

  describe('Successful deletion', () => {
    it('should delete coupon and return success', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'coupon-1', networkId: 'n1' }]),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should return 404 when coupon not found', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe('Coupon not found');
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache after successful deletion', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'coupon-1', networkId: 'n1' }]),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await DELETE(createRequest(), createParams());

      expect(mockInvalidateCouponCache).toHaveBeenCalledWith('n1');
      expect(mockInvalidateCouponCache).toHaveBeenCalledTimes(1);
    });

    it('should not invalidate cache when coupon not found', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      await DELETE(createRequest(), createParams());

      expect(mockInvalidateCouponCache).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to delete coupon');
    });
  });
});
