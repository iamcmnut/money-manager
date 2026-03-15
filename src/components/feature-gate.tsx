import type { FeatureFlag } from '@/lib/feature-flags';
import { getFeatureFlag } from '@/lib/feature-flags';

interface FeatureGateProps {
  flag: FeatureFlag;
  kv?: KVNamespace;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function FeatureGate({ flag, kv, children, fallback = null }: FeatureGateProps) {
  const isEnabled = await getFeatureFlag(kv, flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
