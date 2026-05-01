import { levelSummary } from '@/lib/level';

interface Props {
  expTotal: number;
}

export function LevelProgress({ expTotal }: Props) {
  const s = levelSummary(expTotal);
  const pct = Math.max(0, Math.min(100, Math.round(s.progress * 100)));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium">Level {s.level}</span>
        <span className="text-muted-foreground">{s.expToNext} EXP to Lv {s.level + 1}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-module-ev transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
