import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getFeatureFlag,
  getAllFeatureFlags,
  getDefaultFlags,
  type FeatureFlag,
} from './feature-flags';

// Mock cloudflare module — default to no KV (local dev mode)
vi.mock('./cloudflare', () => ({
  getKV: vi.fn(() => null),
}));

import { getKV } from './cloudflare';
const mockGetKV = vi.mocked(getKV);

describe('getDefaultFlags', () => {
  it('should return all default flag values', () => {
    const flags = getDefaultFlags();

    expect(flags).toEqual({
      module_ev: true,
      module_living_cost: true,
      module_savings: true,
      auth_google: false,
      auth_credentials: false,
      auth_registration: false,
      ev_daily_price_chart: true,
      ev_coupon: true,
      ev_history: true,
      crowd_data: false,
      ev_ocr: false,
      public_profile: true,
      legal_consent_gate: true,
    });
  });

  it('should return a copy, not the original object', () => {
    const flags1 = getDefaultFlags();
    const flags2 = getDefaultFlags();

    flags1.module_ev = false;
    expect(flags2.module_ev).toBe(true);
  });
});

describe('getFeatureFlag (local dev — process.env)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockGetKV.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default value when env var is not set', async () => {
    delete process.env.FEATURE_MODULE_EV;
    const result = await getFeatureFlag('module_ev');
    expect(result).toBe(true);
  });

  it('should return default false for auth flags when env var is not set', async () => {
    delete process.env.FEATURE_AUTH_GOOGLE;
    delete process.env.FEATURE_AUTH_CREDENTIALS;

    const googleResult = await getFeatureFlag('auth_google');
    const credentialsResult = await getFeatureFlag('auth_credentials');

    expect(googleResult).toBe(false);
    expect(credentialsResult).toBe(false);
  });

  it('should return true when env var is set to "true"', async () => {
    process.env.FEATURE_AUTH_GOOGLE = 'true';
    const result = await getFeatureFlag('auth_google');
    expect(result).toBe(true);
  });

  it('should return true when env var is set to "1"', async () => {
    process.env.FEATURE_AUTH_GOOGLE = '1';
    const result = await getFeatureFlag('auth_google');
    expect(result).toBe(true);
  });

  it('should return false when env var is set to "false"', async () => {
    process.env.FEATURE_MODULE_EV = 'false';
    const result = await getFeatureFlag('module_ev');
    expect(result).toBe(false);
  });

  it('should return default when env var is empty string', async () => {
    process.env.FEATURE_MODULE_EV = '';
    const result = await getFeatureFlag('module_ev');
    expect(result).toBe(true);
  });
});

describe('getFeatureFlag (production — KV)', () => {
  let mockKV: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockKV = { get: vi.fn() };
    mockGetKV.mockReturnValue(mockKV as unknown as KVNamespace);
  });

  it('should read flag from KV', async () => {
    mockKV.get.mockResolvedValue('true');
    const result = await getFeatureFlag('auth_google');
    expect(result).toBe(true);
    expect(mockKV.get).toHaveBeenCalledWith('auth_google');
  });

  it('should fall back to process.env when KV returns null', async () => {
    mockKV.get.mockResolvedValue(null);
    const result = await getFeatureFlag('module_ev');
    // KV returned null → falls through to process.env → not set → default true
    expect(result).toBe(true);
  });

  it('should use env var when KV returns null and env var is set', async () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, FEATURE_AUTH_GOOGLE: 'true' };

    mockKV.get.mockResolvedValue(null);
    const result = await getFeatureFlag('auth_google');
    // KV returned null → falls through to process.env → 'true'
    expect(result).toBe(true);

    process.env = originalEnv;
  });

  it('should parse "false" from KV', async () => {
    mockKV.get.mockResolvedValue('false');
    const result = await getFeatureFlag('module_ev');
    expect(result).toBe(false);
  });

  it('should parse "1" from KV', async () => {
    mockKV.get.mockResolvedValue('1');
    const result = await getFeatureFlag('auth_credentials');
    expect(result).toBe(true);
  });
});

describe('getAllFeatureFlags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockGetKV.mockReturnValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return all default flags when no env vars are set', async () => {
    delete process.env.FEATURE_MODULE_EV;
    delete process.env.FEATURE_MODULE_LIVING_COST;
    delete process.env.FEATURE_MODULE_SAVINGS;
    delete process.env.FEATURE_AUTH_GOOGLE;
    delete process.env.FEATURE_AUTH_CREDENTIALS;
    delete process.env.FEATURE_AUTH_REGISTRATION;
    delete process.env.FEATURE_EV_DAILY_PRICE_CHART;
    delete process.env.FEATURE_EV_COUPON;
    delete process.env.FEATURE_EV_HISTORY;
    delete process.env.FEATURE_CROWD_DATA;
    delete process.env.FEATURE_EV_OCR;
    delete process.env.FEATURE_PUBLIC_PROFILE;
    delete process.env.FEATURE_LEGAL_CONSENT_GATE;

    const flags = await getAllFeatureFlags();

    expect(flags).toEqual({
      module_ev: true,
      module_living_cost: true,
      module_savings: true,
      auth_google: false,
      auth_credentials: false,
      auth_registration: false,
      ev_daily_price_chart: true,
      ev_coupon: true,
      ev_history: true,
      crowd_data: false,
      ev_ocr: false,
      public_profile: true,
      legal_consent_gate: true,
    });
  });

  it('should return flags from env vars when set', async () => {
    process.env.FEATURE_MODULE_EV = 'false';
    process.env.FEATURE_AUTH_GOOGLE = 'true';

    const flags = await getAllFeatureFlags();

    expect(flags.module_ev).toBe(false);
    expect(flags.auth_google).toBe(true);
    expect(flags.module_living_cost).toBe(true);
    expect(flags.module_savings).toBe(true);
    expect(flags.auth_credentials).toBe(false);
  });

  it('should read all flags from KV in production', async () => {
    const mockKV = {
      get: vi.fn((key: string) => {
        const values: Record<string, string> = {
          module_ev: 'true',
          auth_google: 'true',
        };
        return Promise.resolve(values[key] ?? null);
      }),
    };
    mockGetKV.mockReturnValue(mockKV as unknown as KVNamespace);

    const flags = await getAllFeatureFlags();

    expect(flags.module_ev).toBe(true);
    expect(flags.auth_google).toBe(true);
    expect(flags.auth_credentials).toBe(false); // default
    expect(mockKV.get).toHaveBeenCalledTimes(13);
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
      'auth_registration',
      'ev_daily_price_chart',
      'ev_coupon',
      'ev_history',
      'crowd_data',
      'ev_ocr',
      'public_profile',
      'legal_consent_gate',
    ];

    expect(validFlags).toHaveLength(13);
  });
});
