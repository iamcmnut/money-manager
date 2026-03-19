import { describe, it, expect, vi, afterEach } from 'vitest';
import { getKVNamespace } from './kv';

const CF_SYMBOL = Symbol.for('__cloudflare-context__');

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
});

describe('getKVNamespace', () => {
  it('returns null when no cloudflare context', () => {
    expect(getKVNamespace()).toBeNull();
  });

  it('returns null when context has no FEATURE_FLAGS', () => {
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: {} };
    expect(getKVNamespace()).toBeNull();
  });

  it('returns KV namespace when FEATURE_FLAGS exists', () => {
    const fakeKV = { get: vi.fn(), put: vi.fn() };
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: { FEATURE_FLAGS: fakeKV } };

    const result = getKVNamespace();

    expect(result).toBe(fakeKV);
  });

  it('returns null on error', () => {
    Object.defineProperty(globalThis, CF_SYMBOL, {
      get() {
        throw new Error('context error');
      },
      configurable: true,
    });

    expect(getKVNamespace()).toBeNull();

    delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
  });
});
