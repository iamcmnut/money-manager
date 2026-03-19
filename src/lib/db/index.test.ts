import { describe, it, expect, vi } from 'vitest';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn().mockReturnValue({ mock: 'database' }),
}));

import { createDb, users, accounts } from './index';

describe('db/index', () => {
  it('should export createDb as a function', () => {
    expect(typeof createDb).toBe('function');
  });

  it('should call drizzle with the provided D1 database and schema', () => {
    const mockD1 = {} as D1Database;
    const db = createDb(mockD1);
    expect(db).toBeDefined();
  });

  it('should re-export schema tables', () => {
    expect(users).toBeDefined();
    expect(accounts).toBeDefined();
  });
});
