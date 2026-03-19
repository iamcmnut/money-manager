import { describe, it, expect, vi, afterEach } from 'vitest';
import { getR2 } from './r2';

const CF_SYMBOL = Symbol.for('__cloudflare-context__');

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
});

describe('getR2', () => {
  it('returns null when no cloudflare context', () => {
    expect(getR2()).toBeNull();
  });

  it('returns null when context has no R2', () => {
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: {} };
    expect(getR2()).toBeNull();
  });

  it('returns R2 bucket when R2 exists', () => {
    const fakeR2 = { get: vi.fn(), put: vi.fn() };
    (globalThis as Record<symbol, unknown>)[CF_SYMBOL] = { env: { R2: fakeR2 } };

    const result = getR2();

    expect(result).toBe(fakeR2);
  });

  it('returns null on error', () => {
    Object.defineProperty(globalThis, CF_SYMBOL, {
      get() {
        throw new Error('context error');
      },
      configurable: true,
    });

    expect(getR2()).toBeNull();

    delete (globalThis as Record<symbol, unknown>)[CF_SYMBOL];
  });
});
