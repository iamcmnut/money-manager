import { describe, it, expect, vi } from 'vitest';
import { createMockKV } from '@/test/setup';
import {
  getFeatureFlag,
  setFeatureFlag,
  getAllFeatureFlags,
  getDefaultFlags,
  type FeatureFlag,
} from './feature-flags';

describe('getDefaultFlags', () => {
  it('should return all default flag values', () => {
    const flags = getDefaultFlags();

    expect(flags).toEqual({
      module_ev: true,
      module_living_cost: true,
      module_savings: true,
      auth_google: false,
      auth_credentials: false,
    });
  });

  it('should return a copy, not the original object', () => {
    const flags1 = getDefaultFlags();
    const flags2 = getDefaultFlags();

    flags1.module_ev = false;
    expect(flags2.module_ev).toBe(true);
  });
});

describe('getFeatureFlag', () => {
  it('should return default value when KV is undefined', async () => {
    const result = await getFeatureFlag(undefined, 'module_ev');
    expect(result).toBe(true);
  });

  it('should return default false for auth flags when KV is undefined', async () => {
    const googleResult = await getFeatureFlag(undefined, 'auth_google');
    const credentialsResult = await getFeatureFlag(undefined, 'auth_credentials');

    expect(googleResult).toBe(false);
    expect(credentialsResult).toBe(false);
  });

  it('should return value from KV when set to true', async () => {
    const kv = createMockKV({ module_ev: 'true' });

    const result = await getFeatureFlag(kv, 'module_ev');
    expect(result).toBe(true);
    expect(kv.get).toHaveBeenCalledWith('module_ev');
  });

  it('should return value from KV when set to false', async () => {
    const kv = createMockKV({ module_ev: 'false' });

    const result = await getFeatureFlag(kv, 'module_ev');
    expect(result).toBe(false);
  });

  it('should return default value when flag not in KV', async () => {
    const kv = createMockKV({});

    const result = await getFeatureFlag(kv, 'module_ev');
    expect(result).toBe(true); // default for module_ev
  });

  it('should return default value when KV throws error', async () => {
    const kv = createMockKV({});
    vi.mocked(kv.get).mockRejectedValueOnce(new Error('KV error'));

    const result = await getFeatureFlag(kv, 'module_ev');
    expect(result).toBe(true); // falls back to default
  });
});

describe('setFeatureFlag', () => {
  it('should set flag to true', async () => {
    const kv = createMockKV({});

    await setFeatureFlag(kv, 'auth_google', true);

    expect(kv.put).toHaveBeenCalledWith('auth_google', 'true');
  });

  it('should set flag to false', async () => {
    const kv = createMockKV({});

    await setFeatureFlag(kv, 'module_ev', false);

    expect(kv.put).toHaveBeenCalledWith('module_ev', 'false');
  });
});

describe('getAllFeatureFlags', () => {
  it('should return all default flags when KV is undefined', async () => {
    const flags = await getAllFeatureFlags(undefined);

    expect(flags).toEqual({
      module_ev: true,
      module_living_cost: true,
      module_savings: true,
      auth_google: false,
      auth_credentials: false,
    });
  });

  it('should return flags from KV when available', async () => {
    const kv = createMockKV({
      module_ev: 'false',
      auth_google: 'true',
    });

    const flags = await getAllFeatureFlags(kv);

    expect(flags.module_ev).toBe(false);
    expect(flags.auth_google).toBe(true);
    // Others should be defaults
    expect(flags.module_living_cost).toBe(true);
    expect(flags.module_savings).toBe(true);
    expect(flags.auth_credentials).toBe(false);
  });

  it('should call KV.get for each flag', async () => {
    const kv = createMockKV({});

    await getAllFeatureFlags(kv);

    expect(kv.get).toHaveBeenCalledTimes(5);
    expect(kv.get).toHaveBeenCalledWith('module_ev');
    expect(kv.get).toHaveBeenCalledWith('module_living_cost');
    expect(kv.get).toHaveBeenCalledWith('module_savings');
    expect(kv.get).toHaveBeenCalledWith('auth_google');
    expect(kv.get).toHaveBeenCalledWith('auth_credentials');
  });
});

describe('FeatureFlag type', () => {
  it('should allow valid flag names', () => {
    const validFlags: FeatureFlag[] = [
      'module_ev',
      'module_living_cost',
      'module_savings',
      'auth_google',
      'auth_credentials',
    ];

    expect(validFlags).toHaveLength(5);
  });
});
