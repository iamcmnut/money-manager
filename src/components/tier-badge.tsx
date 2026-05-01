import { Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { tierForLevel } from '@/lib/tier-config';

interface Props {
  level: number;
  showLevel?: boolean;
  className?: string;
}

const TIER_KEYS: Record<string, 'sprout' | 'charger' | 'voltage' | 'amplifier' | 'megawatt' | 'gridMaster'> = {
  Sprout: 'sprout',
  Charger: 'charger',
  Voltage: 'voltage',
  Amplifier: 'amplifier',
  Megawatt: 'megawatt',
  'Grid Master': 'gridMaster',
};

export async function TierBadge({ level, showLevel = true, className }: Props) {
  const tier = tierForLevel(level);
  const t = await getTranslations('crowdData');
  const tierLabel = t(`tiers.${TIER_KEYS[tier.name] ?? 'sprout'}`);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-module-ev-muted px-2.5 py-1 text-xs font-medium text-module-ev ${className ?? ''}`}
    >
      <Award className="h-3.5 w-3.5" aria-hidden="true" />
      {showLevel ? <span>{t('profile.level')} {level}</span> : null}
      <span>·</span>
      <span>{tierLabel}</span>
    </span>
  );
}
