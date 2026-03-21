import { getKV } from './cloudflare';

export type FeatureFlag =
  | 'module_ev'
  | 'module_living_cost'
  | 'module_savings'
  | 'auth_google'
  | 'auth_credentials'
  | 'auth_registration';

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  module_ev: true,
  module_living_cost: true,
  module_savings: true,
  auth_google: false,
  auth_credentials: false,
  auth_registration: false,
};

// Map feature flags to environment variable names (used for local dev fallback)
const FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  module_ev: 'FEATURE_MODULE_EV',
  module_living_cost: 'FEATURE_MODULE_LIVING_COST',
  module_savings: 'FEATURE_MODULE_SAVINGS',
  auth_google: 'FEATURE_AUTH_GOOGLE',
  auth_credentials: 'FEATURE_AUTH_CREDENTIALS',
  auth_registration: 'FEATURE_AUTH_REGISTRATION',
};

function parseBoolean(value: string | null | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get a single feature flag value.
 * In production: reads from Cloudflare Workers KV.
 * In local dev: falls back to process.env.
 */
export async function getFeatureFlag(flag: FeatureFlag): Promise<boolean> {
  // Try KV first (Cloudflare Workers production)
  const kv = getKV();
  if (kv) {
    const value = await kv.get(flag);
    return parseBoolean(value, DEFAULT_FLAGS[flag]);
  }

  // Fallback to process.env (local development)
  const envVar = FLAG_ENV_MAP[flag];
  const envValue = process.env[envVar];
  return parseBoolean(envValue, DEFAULT_FLAGS[flag]);
}

/**
 * Get all feature flags.
 * In production: reads from Cloudflare Workers KV.
 * In local dev: falls back to process.env.
 */
export async function getAllFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
  const flags: Record<FeatureFlag, boolean> = { ...DEFAULT_FLAGS };

  const flagKeys: FeatureFlag[] = [
    'module_ev',
    'module_living_cost',
    'module_savings',
    'auth_google',
    'auth_credentials',
    'auth_registration',
  ];

  await Promise.all(
    flagKeys.map(async (key) => {
      flags[key] = await getFeatureFlag(key);
    })
  );

  return flags;
}

export function getDefaultFlags(): Record<FeatureFlag, boolean> {
  return { ...DEFAULT_FLAGS };
}
