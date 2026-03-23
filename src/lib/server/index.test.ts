import { describe, it, expect } from 'vitest';
import { createDatabase, getDatabase, getKVNamespace } from './index';

describe('server/index exports', () => {
  it('exports createDatabase function', () => {
    expect(typeof createDatabase).toBe('function');
  });

  it('exports getDatabase function', () => {
    expect(typeof getDatabase).toBe('function');
  });

  it('exports getKVNamespace function', () => {
    expect(typeof getKVNamespace).toBe('function');
  });
});
