import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn().mockReturnValue({ mock: 'database' }),
}));

import { getCloudflareEnv, getDb, getKV, isCloudflareEnv } from './cloudflare';

const CF_SYMBOL = Symbol.for('__cloudflare-context__');

function setCloudflareContext(env: Record<string, unknown> | undefined) {
  if (env) {
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env };
  } else {
    delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
  }
}

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
});

describe('getCloudflareEnv', () => {
  it('returns null when no context is set', () => {
    expect(getCloudflareEnv()).toBeNull();
  });

  it('returns null when context has no DB', () => {
    setCloudflareContext({ FEATURE_FLAGS: {} });
    expect(getCloudflareEnv()).toBeNull();
  });

  it('returns env when DB exists', () => {
    const mockEnv = { DB: { mock: 'd1' }, FEATURE_FLAGS: { mock: 'kv' } };
    setCloudflareContext(mockEnv);
    const result = getCloudflareEnv();
    expect(result).not.toBeNull();
    expect(result!.DB).toBe(mockEnv.DB);
  });
});

describe('getDb', () => {
  it('returns null when no context is set', () => {
    expect(getDb()).toBeNull();
  });

  it('returns drizzle instance when DB exists', () => {
    setCloudflareContext({ DB: { mock: 'd1' } });
    const db = getDb();
    expect(db).toEqual({ mock: 'database' });
  });
});

describe('getKV', () => {
  it('returns null when no context is set', () => {
    expect(getKV()).toBeNull();
  });

  it('returns KV when FEATURE_FLAGS exists', () => {
    const mockKV = { mock: 'kv' };
    setCloudflareContext({ DB: { mock: 'd1' }, FEATURE_FLAGS: mockKV });
    expect(getKV()).toBe(mockKV);
  });
});

describe('isCloudflareEnv', () => {
  it('returns false when no context is set', () => {
    expect(isCloudflareEnv()).toBe(false);
  });

  it('returns true when context with DB exists', () => {
    setCloudflareContext({ DB: { mock: 'd1' } });
    expect(isCloudflareEnv()).toBe(true);
  });
});
