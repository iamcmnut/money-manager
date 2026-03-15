import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getFeatureFlag,
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
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default value when env var is not set', () => {
    delete process.env.FEATURE_MODULE_EV;
    const result = getFeatureFlag('module_ev');
    expect(result).toBe(true);
  });

  it('should return default false for auth flags when env var is not set', () => {
    delete process.env.FEATURE_AUTH_GOOGLE;
    delete process.env.FEATURE_AUTH_CREDENTIALS;

    const googleResult = getFeatureFlag('auth_google');
    const credentialsResult = getFeatureFlag('auth_credentials');

    expect(googleResult).toBe(false);
    expect(credentialsResult).toBe(false);
  });

  it('should return true when env var is set to "true"', () => {
    process.env.FEATURE_AUTH_GOOGLE = 'true';
    const result = getFeatureFlag('auth_google');
    expect(result).toBe(true);
  });

  it('should return true when env var is set to "1"', () => {
    process.env.FEATURE_AUTH_GOOGLE = '1';
    const result = getFeatureFlag('auth_google');
    expect(result).toBe(true);
  });

  it('should return false when env var is set to "false"', () => {
    process.env.FEATURE_MODULE_EV = 'false';
    const result = getFeatureFlag('module_ev');
    expect(result).toBe(false);
  });

  it('should return default when env var is empty string', () => {
    process.env.FEATURE_MODULE_EV = '';
    const result = getFeatureFlag('module_ev');
    expect(result).toBe(true); // default for module_ev
  });
});

describe('getAllFeatureFlags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return all default flags when no env vars are set', () => {
    delete process.env.FEATURE_MODULE_EV;
    delete process.env.FEATURE_MODULE_LIVING_COST;
    delete process.env.FEATURE_MODULE_SAVINGS;
    delete process.env.FEATURE_AUTH_GOOGLE;
    delete process.env.FEATURE_AUTH_CREDENTIALS;

    const flags = getAllFeatureFlags();

    expect(flags).toEqual({
      module_ev: true,
      module_living_cost: true,
      module_savings: true,
      auth_google: false,
      auth_credentials: false,
    });
  });

  it('should return flags from env vars when set', () => {
    process.env.FEATURE_MODULE_EV = 'false';
    process.env.FEATURE_AUTH_GOOGLE = 'true';

    const flags = getAllFeatureFlags();

    expect(flags.module_ev).toBe(false);
    expect(flags.auth_google).toBe(true);
    // Others should be defaults
    expect(flags.module_living_cost).toBe(true);
    expect(flags.module_savings).toBe(true);
    expect(flags.auth_credentials).toBe(false);
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
