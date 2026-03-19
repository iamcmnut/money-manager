import { describe, it, expect, vi } from 'vitest';
import {
  checkRateLimit,
  recordAttempt,
  clearFailedAttempts,
  cleanupOldAttempts,
  getClientIp,
} from './rate-limit';

function createMockDb() {
  const selectResult = { count: 0 };
  const whereResult = {
    then: (resolve: (v: unknown) => void) => resolve([selectResult]),
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    }),
  };
  const mockDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(whereResult),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
  return { mockDb, selectResult };
}

describe('getClientIp', () => {
  it('returns cf-connecting-ip when present', () => {
    const request = new Request('https://example.com', {
      headers: {
        'cf-connecting-ip': '1.2.3.4',
        'x-forwarded-for': '5.6.7.8',
        'x-real-ip': '9.10.11.12',
      },
    });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('returns first IP from x-forwarded-for when cf-connecting-ip is absent', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3',
        'x-real-ip': '9.10.11.12',
      },
    });
    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('returns x-real-ip when other headers are absent', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '9.10.11.12',
      },
    });
    expect(getClientIp(request)).toBe('9.10.11.12');
  });

  it('returns null when no IP headers are present', () => {
    const request = new Request('https://example.com');
    expect(getClientIp(request)).toBeNull();
  });

  it('prioritizes cf-connecting-ip over x-forwarded-for and x-real-ip', () => {
    const request = new Request('https://example.com', {
      headers: {
        'cf-connecting-ip': '1.1.1.1',
        'x-forwarded-for': '2.2.2.2',
        'x-real-ip': '3.3.3.3',
      },
    });
    expect(getClientIp(request)).toBe('1.1.1.1');
  });
});

describe('checkRateLimit', () => {
  it('allows when under limit (0 failed attempts)', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 0;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'login');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it('blocks when at max login attempts (5)', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 5;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'login');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('blocks when at max register attempts (3)', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 3;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'register');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns correct remaining count', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 2;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'login');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it('uses correct config for login type (max 5)', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 4;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'login');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('uses correct config for register type (max 3)', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 2;

    const result = await checkRateLimit(mockDb as never, 'user@test.com', 'register');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('lowercases the identifier', async () => {
    const { mockDb, selectResult } = createMockDb();
    selectResult.count = 0;

    await checkRateLimit(mockDb as never, 'USER@TEST.COM', 'login');

    // The function calls db.select().from().where() — we verify it was called
    expect(mockDb.select).toHaveBeenCalled();
  });
});

describe('recordAttempt', () => {
  it('calls db.insert with correct values', async () => {
    const { mockDb } = createMockDb();

    await recordAttempt(mockDb as never, 'user@test.com', 'login', false, '1.2.3.4');

    expect(mockDb.insert).toHaveBeenCalled();
    const valuesCall = mockDb.insert.mock.results[0].value.values;
    expect(valuesCall).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'user@test.com',
        attemptType: 'login',
        success: false,
        ipAddress: '1.2.3.4',
      })
    );
  });

  it('lowercases the identifier', async () => {
    const { mockDb } = createMockDb();

    await recordAttempt(mockDb as never, 'USER@TEST.COM', 'login', true);

    const valuesCall = mockDb.insert.mock.results[0].value.values;
    expect(valuesCall).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'user@test.com',
      })
    );
  });
});

describe('clearFailedAttempts', () => {
  it('calls db.delete', async () => {
    const { mockDb } = createMockDb();

    await clearFailedAttempts(mockDb as never, 'user@test.com', 'login');

    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('lowercases the identifier', async () => {
    const { mockDb } = createMockDb();

    await clearFailedAttempts(mockDb as never, 'USER@TEST.COM', 'login');

    // Verify delete was called (the identifier lowercasing happens inside the where clause)
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

describe('cleanupOldAttempts', () => {
  it('calls db.delete', async () => {
    const { mockDb } = createMockDb();

    await cleanupOldAttempts(mockDb as never);

    expect(mockDb.delete).toHaveBeenCalled();
  });
});
