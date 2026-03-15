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
  auth_credentials: false, // Email/password auth disabled by default
};

export async function getFeatureFlag(
  kv: KVNamespace | undefined,
  flag: FeatureFlag
): Promise<boolean> {
  if (!kv) {
    return DEFAULT_FLAGS[flag] ?? false;
  }

  try {
    const value = await kv.get(flag);
    if (value === null) {
      return DEFAULT_FLAGS[flag] ?? false;
    }
    return value === 'true';
  } catch {
    return DEFAULT_FLAGS[flag] ?? false;
  }
}

export async function setFeatureFlag(
  kv: KVNamespace,
  flag: FeatureFlag,
  value: boolean
): Promise<void> {
  await kv.put(flag, value.toString());
}

export async function getAllFeatureFlags(
  kv: KVNamespace | undefined
): Promise<Record<FeatureFlag, boolean>> {
  const flags: Record<FeatureFlag, boolean> = { ...DEFAULT_FLAGS };

  if (!kv) {
    return flags;
  }

  const flagKeys: FeatureFlag[] = [
    'module_ev',
    'module_living_cost',
    'module_savings',
    'auth_google',
    'auth_credentials',
  ];

  await Promise.all(
    flagKeys.map(async (key) => {
      flags[key] = await getFeatureFlag(kv, key);
    })
  );

  return flags;
}

export function getDefaultFlags(): Record<FeatureFlag, boolean> {
  return { ...DEFAULT_FLAGS };
}
