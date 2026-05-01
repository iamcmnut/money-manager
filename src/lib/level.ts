import { tierForLevel, type Tier } from './tier-config';

/**
 * Cumulative EXP needed to advance from `level` to `level + 1`.
 * Level 1 starts at 0 EXP; reaching 50 promotes to level 2, 150 → 3, 300 → 4, etc.
 */
export function expRequiredToAdvance(level: number): number {
  return 25 * level * (level + 1);
}

export function levelFromExp(total: number): number {
  if (total < 50) return 1;
  let level = 1;
  while (expRequiredToAdvance(level) <= total) level++;
  return level;
}

export function expIntoCurrentLevel(total: number): number {
  const level = levelFromExp(total);
  if (level === 1) return total;
  return total - expRequiredToAdvance(level - 1);
}

export function expForNextLevel(total: number): number {
  const level = levelFromExp(total);
  return expRequiredToAdvance(level) - total;
}

export interface LevelSummary {
  level: number;
  tier: Tier;
  expTotal: number;
  expIntoLevel: number;
  expToNext: number;
  progress: number;
}

export function levelSummary(expTotal: number): LevelSummary {
  const level = levelFromExp(expTotal);
  const start = level === 1 ? 0 : expRequiredToAdvance(level - 1);
  const end = expRequiredToAdvance(level);
  const expIntoLevel = expTotal - start;
  const expToNext = end - expTotal;
  return {
    level,
    tier: tierForLevel(level),
    expTotal,
    expIntoLevel,
    expToNext,
    progress: end > start ? expIntoLevel / (end - start) : 0,
  };
}
