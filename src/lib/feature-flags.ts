import { getKV } from './cloudflare';

const DEFAULT_FLAGS = {
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
} as const satisfies Record<string, boolean>;

export type FeatureFlag = keyof typeof DEFAULT_FLAGS;

export const ALL_FLAGS = Object.keys(DEFAULT_FLAGS) as FeatureFlag[];

// Map feature flags to environment variable names (used for local dev fallback)
const FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  module_ev: 'FEATURE_MODULE_EV',
  module_living_cost: 'FEATURE_MODULE_LIVING_COST',
  module_savings: 'FEATURE_MODULE_SAVINGS',
  auth_google: 'FEATURE_AUTH_GOOGLE',
  auth_credentials: 'FEATURE_AUTH_CREDENTIALS',
  auth_registration: 'FEATURE_AUTH_REGISTRATION',
  ev_daily_price_chart: 'FEATURE_EV_DAILY_PRICE_CHART',
  ev_coupon: 'FEATURE_EV_COUPON',
  ev_history: 'FEATURE_EV_HISTORY',
  crowd_data: 'FEATURE_CROWD_DATA',
  ev_ocr: 'FEATURE_EV_OCR',
  public_profile: 'FEATURE_PUBLIC_PROFILE',
  legal_consent_gate: 'FEATURE_LEGAL_CONSENT_GATE',
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
    if (value !== null) {
      return parseBoolean(value, DEFAULT_FLAGS[flag]);
    }
  }

  // Fallback to process.env (local development, or KV key not set)
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

  await Promise.all(
    ALL_FLAGS.map(async (key) => {
      flags[key] = await getFeatureFlag(key);
    })
  );

  return flags;
}

export function getDefaultFlags(): Record<FeatureFlag, boolean> {
  return { ...DEFAULT_FLAGS };
}
