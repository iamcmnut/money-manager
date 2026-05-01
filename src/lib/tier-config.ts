export interface Tier {
  name: string;
  minLevel: number;
  maxLevel: number;
}

export const TIERS: readonly Tier[] = [
  { name: 'Sprout', minLevel: 1, maxLevel: 4 },
  { name: 'Charger', minLevel: 5, maxLevel: 9 },
  { name: 'Voltage', minLevel: 10, maxLevel: 19 },
  { name: 'Amplifier', minLevel: 20, maxLevel: 39 },
  { name: 'Megawatt', minLevel: 40, maxLevel: 69 },
  { name: 'Grid Master', minLevel: 70, maxLevel: Number.POSITIVE_INFINITY },
] as const;

export function tierForLevel(level: number): Tier {
  for (const t of TIERS) {
    if (level >= t.minLevel && level <= t.maxLevel) return t;
  }
  return TIERS[TIERS.length - 1];
}
