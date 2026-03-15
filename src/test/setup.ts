import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock KVNamespace for feature flag tests
export function createMockKV(data: Record<string, string> = {}): KVNamespace {
  const store = new Map(Object.entries(data));

  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async () => ({
      keys: Array.from(store.keys()).map((name) => ({ name })),
      list_complete: true,
      cacheStatus: null,
    })),
    getWithMetadata: vi.fn(async (key: string) => ({
      value: store.get(key) ?? null,
      metadata: null,
      cacheStatus: null,
    })),
  } as unknown as KVNamespace;
}

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
