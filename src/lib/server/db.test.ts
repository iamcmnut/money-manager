import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn().mockReturnValue({ mock: 'database' }),
}));

vi.mock('../db/schema', () => ({
  default: {},
}));

import { createDatabase, getDatabase } from './db';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

const CF_SYMBOL = Symbol.for('__cloudflare-context__');

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
  vi.clearAllMocks();
});

describe('createDatabase', () => {
  it('calls drizzle with d1 and schema', () => {
    const fakeD1 = { fake: 'd1' } as unknown as D1Database;
    const result = createDatabase(fakeD1);

    expect(drizzle).toHaveBeenCalledWith(fakeD1, { schema });
    expect(result).toEqual({ mock: 'database' });
  });
});

describe('getDatabase', () => {
  it('returns null when no cloudflare context', () => {
    expect(getDatabase()).toBeNull();
  });

  it('returns null when context has no DB', () => {
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: {} };
    expect(getDatabase()).toBeNull();
  });

  it('returns database when context has DB', () => {
    const fakeD1 = { fake: 'd1' };
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: { DB: fakeD1 } };

    const result = getDatabase();

    expect(result).toEqual({ mock: 'database' });
    expect(drizzle).toHaveBeenCalledWith(fakeD1, { schema });
  });

  it('returns null when context throws', () => {
    Object.defineProperty(globalThis, CF_SYMBOL, {
      get() {
        throw new Error('context error');
      },
      configurable: true,
    });

    expect(getDatabase()).toBeNull();

    delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
  });
});
