import type { FeatureFlag } from '@/lib/feature-flags';
import { getFeatureFlag } from '@/lib/feature-flags';

interface FeatureGateProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const isEnabled = await getFeatureFlag(flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
