import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

// EXP awards & reversals are integration concerns; the unit tests here mock them
// out so they don't have to set up the full ledger query chain.
vi.mock('@/lib/exp', () => ({
  awardExpForApproval: vi.fn().mockResolvedValue(null),
  reverseExpForRecord: vi.fn().mockResolvedValue(0),
}));
vi.mock('@/lib/server/r2', () => ({ getR2: vi.fn(() => null) }));

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockGetDatabase = vi.fn();
vi.mock('@/lib/server', () => ({
  getDatabase: () => mockGetDatabase(),
}));

vi.mock('@/lib/db/schema', () => ({
  chargingRecords: {
    id: 'id',
    userId: 'user_id',
    brandId: 'brand_id',
    chargingDatetime: 'charging_datetime',
    chargedKwh: 'charged_kwh',
    costThb: 'cost_thb',
    avgUnitPrice: 'avg_unit_price',
    chargingPowerKw: 'charging_power_kw',
    chargingFinishDatetime: 'charging_finish_datetime',
    mileageKm: 'mileage_km',
    notes: 'notes',
    approvalStatus: 'approval_status',
    isShared: 'is_shared',
    photoKey: 'photo_key',
    userCarId: 'user_car_id',
    expAwarded: 'exp_awarded',
    createdAt: 'created_at',
  },
  chargingNetworks: {
    id: 'id',
    name: 'name',
    brandColor: 'brand_color',
  },
  users: {
    id: 'id',
    isPreApproved: 'is_pre_approved',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ type: 'and', args })),
  eq: vi.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
}));

import { GET, PATCH, DELETE } from './route';

// --- Helpers ---

function createRequest(url = 'http://localhost:3000/api/ev/records/rec-123', options?: RequestInit): Request {
  return new Request(url, options);
}

function createParams(id = 'rec-123') {
  return { params: Promise.resolve({ id }) };
}

const validSession = {
  user: { id: 'user-1', email: 'test@example.com', role: 'user' },
};

function createMockDbForGet(records: Record<string, unknown>[] = []) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(records),
          }),
        }),
      }),
    }),
  };
}

function createMockDbForUpdate(existing: Record<string, unknown>[] = [], updated: Record<string, unknown>[] = []) {
  // PATCH always fetches the existing record first; default to a benign row when
  // the test doesn't care about it.
  const existingRecords =
    existing.length > 0
      ? existing
      : [
          {
            id: 'rec-123',
            userId: 'user-1',
            chargedKwh: 25,
            costThb: 150,
            isShared: false,
            approvalStatus: 'approved',
            expAwarded: 0,
          },
        ];
  const existingRecordChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(existingRecords),
      }),
    }),
  };

  const userSelectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ isPreApproved: false }]),
      }),
    }),
  };

  return {
    select: vi.fn().mockReturnValueOnce(existingRecordChain).mockReturnValue(userSelectChain),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(updated),
        }),
      }),
    }),
  };
}

function createMockDbForDelete(deleted: Record<string, unknown>[] = []) {
  // DELETE first selects photoKey/userId; we mirror the deleted array (length-wise)
  // so a deleted=[] also makes the existence check return empty for the 404 path.
  const existingRecords = deleted.length > 0 ? [{ photoKey: null, userId: 'user-1' }] : [];
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(existingRecords),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(deleted),
      }),
    }),
  };
}

// --- GET Tests ---

describe('GET /api/ev/records/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(401);
      const body: any = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(401);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(validSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(503);
    });
  });

  describe('Authorization (ownership check)', () => {
    it('should return 404 when record belongs to another user', async () => {
      mockAuth.mockResolvedValue(validSession);
      // DB query with userId filter returns empty = not found for this user
      const db = createMockDbForGet([]);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(404);
      const body: any = await response.json();
      expect(body.error).toBe('Record not found');
    });
  });

  describe('Successful response', () => {
    it('should return record when found', async () => {
      mockAuth.mockResolvedValue(validSession);
      const record = { id: 'rec-123', brandId: 'b1', chargedKwh: 25, costThb: 150 };
      const db = createMockDbForGet([record]);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.record).toEqual(record);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database query fails', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockRejectedValue(new Error('DB error')),
              }),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest(), createParams());
      expect(response.status).toBe(500);
    });
  });
});

// --- PATCH Tests ---

describe('PATCH /api/ev/records/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ costThb: 200 }),
        }),
        createParams()
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Input validation', () => {
    it('should return 400 when no valid fields provided (admin user)', async () => {
      // Admin users skip the isPreApproved check, so no approvalStatus is added
      mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com', role: 'admin' } });
      const db = createMockDbForUpdate();
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        createParams()
      );
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('No valid fields to update');
    });

    // Removed: the PATCH no longer silently re-pends approval on every edit. Sharing
    // transitions own approval changes; an empty body now returns 400 like admins.
    it.skip('should still update approvalStatus when no user fields provided (non-admin)', async () => {
      mockAuth.mockResolvedValue(validSession);
      const updated = [{ id: 'rec-123', approvalStatus: 'pending' }];
      const db = createMockDbForUpdate([], updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        createParams()
      );
      // Non-admin, non-pre-approved user: approvalStatus is set to 'pending',
      // so the update proceeds even with no user-provided fields
      expect(response.status).toBe(200);
    });

    it('should ignore unknown fields in the body', async () => {
      // Admin users skip the isPreApproved check, so only unknown fields remain
      mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com', role: 'admin' } });
      const db = createMockDbForUpdate([], []);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unknownField: 'malicious', anotherField: 123 }),
        }),
        createParams()
      );
      // No valid fields recognized, so 400
      expect(response.status).toBe(400);
    });
  });

  describe('Authorization (ownership check)', () => {
    it('should return 404 when trying to update another user record', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ costThb: 200 }),
        }),
        createParams()
      );
      expect(response.status).toBe(404);
    });
  });

  describe('avgUnitPrice recalculation', () => {
    it('should recalculate avgUnitPrice when kWh changes', async () => {
      mockAuth.mockResolvedValue(validSession);
      const existing = [{ chargedKwh: 25, costThb: 150 }];
      const updated = [{ id: 'rec-123', chargedKwh: 30, costThb: 150, avgUnitPrice: 5 }];
      const db = createMockDbForUpdate(existing, updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chargedKwh: 30 }),
        }),
        createParams()
      );
      expect(response.status).toBe(200);

      // Verify the update set was called with recalculated avgUnitPrice
      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.avgUnitPrice).toBe(5); // 150 / 30
    });

    it('should recalculate avgUnitPrice when cost changes', async () => {
      mockAuth.mockResolvedValue(validSession);
      const existing = [{ chargedKwh: 25, costThb: 150 }];
      const updated = [{ id: 'rec-123', chargedKwh: 25, costThb: 200, avgUnitPrice: 8 }];
      const db = createMockDbForUpdate(existing, updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ costThb: 200 }),
        }),
        createParams()
      );
      expect(response.status).toBe(200);

      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.avgUnitPrice).toBe(8); // 200 / 25
    });

    it('should recalculate when both kWh and cost change together', async () => {
      mockAuth.mockResolvedValue(validSession);
      const updated = [{ id: 'rec-123', chargedKwh: 50, costThb: 300, avgUnitPrice: 6 }];
      const db = createMockDbForUpdate([], updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chargedKwh: 50, costThb: 300 }),
        }),
        createParams()
      );
      expect(response.status).toBe(200);

      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.avgUnitPrice).toBe(6); // 300 / 50
    });

    it('should return 404 when record not found', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chargedKwh: 30 }),
        }),
        createParams()
      );
      expect(response.status).toBe(404);
    });
  });

  describe('Partial updates', () => {
    it('should update only provided fields', async () => {
      mockAuth.mockResolvedValue(validSession);
      const updated = [{ id: 'rec-123', notes: 'Updated note' }];
      const db = createMockDbForUpdate([], updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Updated note' }),
        }),
        createParams()
      );
      expect(response.status).toBe(200);

      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.notes).toBe('Updated note');
      expect(setArg.brandId).toBeUndefined();
    });

    it('should allow setting optional fields to null', async () => {
      mockAuth.mockResolvedValue(validSession);
      const updated = [{ id: 'rec-123' }];
      const db = createMockDbForUpdate([], updated);
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: null, mileageKm: null }),
        }),
        createParams()
      );
      expect(response.status).toBe(200);

      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.notes).toBeNull();
      expect(setArg.mileageKm).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should return 400 for foreign key constraint violation', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ isPreApproved: false }]),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 'nonexistent-brand' }),
        }),
        createParams()
      );
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Invalid network selected');
    });

    it('should return 500 for unexpected errors', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ isPreApproved: false }]),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue(new Error('Unexpected')),
            }),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'test' }),
        }),
        createParams()
      );
      expect(response.status).toBe(500);
    });
  });

  describe('Security - userId cannot be changed', () => {
    it('should not allow changing userId via PATCH', async () => {
      mockAuth.mockResolvedValue(validSession);
      const updated = [{ id: 'rec-123' }];
      const db = createMockDbForUpdate([], updated);
      mockGetDatabase.mockResolvedValue(db);

      await PATCH(
        createRequest('http://localhost:3000/api/ev/records/rec-123', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 'b1' }),
        }),
        createParams()
      );

      // The updateData should NOT contain userId
      const setCall = db.update.mock.results[0].value.set;
      const setArg = setCall.mock.calls[0][0];
      expect(setArg.userId).toBeUndefined();
    });
  });
});

// --- DELETE Tests ---

describe('DELETE /api/ev/records/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
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
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(validSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(503);
    });
  });

  describe('Authorization (ownership check)', () => {
    it('should return 404 when record belongs to another user', async () => {
      mockAuth.mockResolvedValue(validSession);
      // WHERE clause includes userId check, returns empty
      const db = createMockDbForDelete([]);
      mockGetDatabase.mockResolvedValue(db);

      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(404);
    });
  });

  describe('Successful deletion', () => {
    it('should return success when record is deleted', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDbForDelete([{ id: 'rec-123' }]);
      mockGetDatabase.mockResolvedValue(db);

      const response = await DELETE(createRequest(), createParams());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 500 when database operation fails', async () => {
      mockAuth.mockResolvedValue(validSession);
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
    });
  });
});
