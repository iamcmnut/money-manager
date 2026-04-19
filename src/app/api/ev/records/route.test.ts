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
    createdAt: 'created_at',
  },
  chargingNetworks: {
    id: 'id',
    name: 'name',
    brandColor: 'brand_color',
    logo: 'logo',
  },
  users: {
    id: 'id',
    isPreApproved: 'is_pre_approved',
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

function createRequest(url = 'http://localhost:3000/api/ev/records', options?: RequestInit): Request {
  return new Request(url, options);
}

function createMockDb(records: Record<string, unknown>[] = [], total = 0) {
  const mockLimit = vi.fn().mockReturnValue({
    offset: vi.fn().mockResolvedValue(records),
  });
  const mockOrderBy = vi.fn().mockReturnValue({
    limit: mockLimit,
  });
  const mockRecordsWhere = vi.fn().mockReturnValue({
    orderBy: mockOrderBy,
  });

  // Each select().from() result supports both GET patterns and user query pattern
  // GET records: select().from().leftJoin().where().orderBy().limit().offset()
  // GET count: select().from().where() -> resolves to [{ count: total }]
  // POST user query: select().from(users).where().limit() -> resolves to [{ isPreApproved: false }]
  const createWhereResult = () => {
    const result = Promise.resolve([{ count: total }]);
    (result as any).limit = vi.fn().mockResolvedValue([{ isPreApproved: false }]);
    return result;
  };

  const createFromChain = () => ({
    leftJoin: vi.fn().mockReturnValue({
      where: mockRecordsWhere,
    }),
    where: vi.fn().mockImplementation(() => createWhereResult()),
  });

  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => createFromChain()),
    })),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'rec-123' }]),
      }),
    }),
  };
}

const validSession = {
  user: { id: 'user-1', email: 'test@example.com', role: 'user' },
};

// --- GET Tests ---

describe('GET /api/ev/records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await GET(createRequest());
      expect(response.status).toBe(401);
      const body: any = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null });
      const response = await GET(createRequest());
      expect(response.status).toBe(401);
    });

    it('should return 401 when session is empty object', async () => {
      mockAuth.mockResolvedValue({});
      const response = await GET(createRequest());
      expect(response.status).toBe(401);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(validSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await GET(createRequest());
      expect(response.status).toBe(503);
      const body: any = await response.json();
      expect(body.error).toBe('Database not available');
    });
  });

  describe('Pagination', () => {
    it('should use default pagination (page=1, limit=10)', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
    });

    it('should respect custom page and limit', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?page=2&limit=5'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(2);
      expect(body.limit).toBe(5);
    });

    it('should clamp limit to max 100', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?limit=999'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.limit).toBe(100);
    });

    it('should clamp limit to min 1', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?limit=0'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.limit).toBe(1);
    });

    it('should clamp page to min 1', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?page=-1'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.page).toBe(1);
    });

    it('should result in NaN page when given non-numeric page param', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?page=abc'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      // parseInt('abc') = NaN, Math.max(1, NaN) = NaN
      expect(body.page).toBeNull();
    });

    it('should result in NaN limit when given non-numeric limit param', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest('http://localhost:3000/api/ev/records?limit=abc'));
      expect(response.status).toBe(200);
      const body: any = await response.json();
      // parseInt('abc') = NaN, Math.min(100, Math.max(1, NaN)) = NaN
      expect(body.limit).toBeNull();
    });
  });

  describe('Successful response', () => {
    it('should return records with total count', async () => {
      mockAuth.mockResolvedValue(validSession);
      const records = [
        { id: 'rec-1', brandId: 'b1', chargedKwh: 25, costThb: 150 },
      ];
      const db = createMockDb(records, 1);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.records).toEqual(records);
      expect(body.total).toBe(1);
    });

    it('should return empty records array when no data', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb([], 0);
      mockGetDatabase.mockResolvedValue(db);

      const response = await GET(createRequest());
      expect(response.status).toBe(200);
      const body: any = await response.json();
      expect(body.records).toEqual([]);
      expect(body.total).toBe(0);
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
      expect(body.error).toBe('Failed to fetch charging records');
    });
  });
});

// --- POST Tests ---

describe('POST /api/ev/records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    brandId: 'brand-1',
    chargingDatetime: '2026-03-20T10:00:00',
    chargedKwh: 25.5,
    costThb: 150.0,
  };

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(401);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(validSession);
      mockGetDatabase.mockResolvedValue(null);
      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(503);
    });
  });

  describe('Input validation', () => {
    it('should return 400 when brandId is missing', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBody, brandId: '' }),
        })
      );
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toContain('required');
    });

    it('should return 400 when chargingDatetime is missing', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBody, chargingDatetime: '' }),
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 when chargedKwh is missing', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 'b1', chargingDatetime: '2026-03-20T10:00', costThb: 100 }),
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 when costThb is missing', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandId: 'b1', chargingDatetime: '2026-03-20T10:00', chargedKwh: 25 }),
        })
      );
      expect(response.status).toBe(400);
    });

    it('should return 400 when body is empty', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
      );
      expect(response.status).toBe(400);
    });
  });

  describe('Average unit price calculation', () => {
    it('should calculate avgUnitPrice correctly', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBody, chargedKwh: 20, costThb: 100 }),
        })
      );

      // Check that insert was called with avgUnitPrice = 100/20 = 5
      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.avgUnitPrice).toBe(5);
    });

    it('should set avgUnitPrice to null when kWh is 0', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBody, chargedKwh: 0, costThb: 100 }),
        })
      );

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.avgUnitPrice).toBeNull();
    });
  });

  describe('Successful creation', () => {
    it('should return 201 with created record', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(201);
      const body: any = await response.json();
      expect(body.record).toBeDefined();
    });

    it('should use the authenticated user ID, not a user-supplied one', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...validBody, userId: 'attacker-id' }),
        })
      );

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.userId).toBe('user-1');
    });

    it('should handle optional fields correctly', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...validBody,
            chargingPowerKw: 150,
            chargingFinishDatetime: '2026-03-20T11:00:00',
            mileageKm: 45000,
            notes: 'Test note',
          }),
        })
      );

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.chargingPowerKw).toBe(150);
      expect(valuesArg.mileageKm).toBe(45000);
      expect(valuesArg.notes).toBe('Test note');
    });

    it('should set optional fields to null when not provided', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.chargingPowerKw).toBeNull();
      expect(valuesArg.chargingFinishDatetime).toBeNull();
      expect(valuesArg.mileageKm).toBeNull();
      expect(valuesArg.notes).toBeNull();
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
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('FOREIGN KEY constraint failed')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(400);
      const body: any = await response.json();
      expect(body.error).toBe('Invalid network selected');
    });

    it('should return 500 for unexpected database errors', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ isPreApproved: false }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockRejectedValue(new Error('Unexpected error')),
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const response = await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );
      expect(response.status).toBe(500);
    });
  });

  describe('Record ID generation', () => {
    it('should generate ID with rec- prefix', async () => {
      mockAuth.mockResolvedValue(validSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      await POST(
        createRequest('http://localhost:3000/api/ev/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validBody),
        })
      );

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.id).toMatch(/^rec-\d+-[a-z0-9]+$/);
    });
  });
});
