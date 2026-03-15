export type FeatureFlag =
  | 'module_ev'
  | 'module_living_cost'
  | 'module_savings'
  | 'auth_google'
  | 'auth_credentials';

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  module_ev: true,
  module_living_cost: true,
  module_savings: true,
  auth_google: false,
  auth_credentials: false,
};

// Map feature flags to environment variable names
const FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  module_ev: 'FEATURE_MODULE_EV',
  module_living_cost: 'FEATURE_MODULE_LIVING_COST',
  module_savings: 'FEATURE_MODULE_SAVINGS',
  auth_google: 'FEATURE_AUTH_GOOGLE',
  auth_credentials: 'FEATURE_AUTH_CREDENTIALS',
};

function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

function getCloudflareEnvFromGlobal(): Record<string, unknown> | undefined {
  const ctx = (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined;
  return ctx?.env;
}

function getEnvValue(envVar: string): string | undefined {
  // Try Cloudflare context first (works in Workers runtime)
  try {
    const cfEnv = getCloudflareEnvFromGlobal();
    if (cfEnv?.[envVar] !== undefined) {
      return String(cfEnv[envVar]);
    }
  } catch {
    // Not in Cloudflare environment
  }

  // Fallback to process.env (works in Node.js / local dev)
  return process.env[envVar];
}

export function getFeatureFlag(flag: FeatureFlag): boolean {
  const envVar = FLAG_ENV_MAP[flag];
  const envValue = getEnvValue(envVar);
  return parseEnvBoolean(envValue, DEFAULT_FLAGS[flag]);
}

export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags: Record<FeatureFlag, boolean> = { ...DEFAULT_FLAGS };

  const flagKeys: FeatureFlag[] = [
    'module_ev',
    'module_living_cost',
    'module_savings',
    'auth_google',
    'auth_credentials',
  ];

  for (const key of flagKeys) {
    flags[key] = getFeatureFlag(key);
  }

  return flags;
}

export function getDefaultFlags(): Record<FeatureFlag, boolean> {
  return { ...DEFAULT_FLAGS };
}
