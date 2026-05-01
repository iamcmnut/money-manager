import { Award } from 'lucide-react';
import { tierForLevel } from '@/lib/tier-config';

interface Props {
  level: number;
  showLevel?: boolean;
  className?: string;
}

export function TierBadge({ level, showLevel = true, className }: Props) {
  const tier = tierForLevel(level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-module-ev-muted px-2.5 py-1 text-xs font-medium text-module-ev ${className ?? ''}`}
    >
      <Award className="h-3.5 w-3.5" aria-hidden="true" />
      {showLevel ? <span>Lv {level}</span> : null}
      <span>·</span>
      <span>{tier.name}</span>
    </span>
  );
}
