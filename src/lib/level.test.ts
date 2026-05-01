import { describe, it, expect } from 'vitest';
import { expRequiredToAdvance, levelFromExp, levelSummary } from './level';

describe('expRequiredToAdvance', () => {
  it('matches the documented thresholds', () => {
    expect(expRequiredToAdvance(1)).toBe(50);
    expect(expRequiredToAdvance(2)).toBe(150);
    expect(expRequiredToAdvance(3)).toBe(300);
    expect(expRequiredToAdvance(5)).toBe(750);
    expect(expRequiredToAdvance(10)).toBe(2750);
    expect(expRequiredToAdvance(20)).toBe(10500);
  });
});

describe('levelFromExp', () => {
  it('maps low EXP to level 1', () => {
    expect(levelFromExp(0)).toBe(1);
    expect(levelFromExp(35)).toBe(1);
    expect(levelFromExp(49)).toBe(1);
  });

  it('promotes at exact thresholds', () => {
    expect(levelFromExp(50)).toBe(2);
    expect(levelFromExp(150)).toBe(3);
    expect(levelFromExp(300)).toBe(4);
    expect(levelFromExp(750)).toBe(6);
    expect(levelFromExp(2750)).toBe(11);
  });

  it('stays at the same level until next threshold', () => {
    expect(levelFromExp(149)).toBe(2);
    expect(levelFromExp(299)).toBe(3);
    expect(levelFromExp(749)).toBe(5);
  });

  it('handles very large EXP without infinite looping', () => {
    expect(levelFromExp(1_000_000)).toBeGreaterThan(100);
  });
});

describe('levelSummary', () => {
  it('returns Sprout tier for level 1', () => {
    const s = levelSummary(0);
    expect(s.level).toBe(1);
    expect(s.tier.name).toBe('Sprout');
    expect(s.expIntoLevel).toBe(0);
    expect(s.expToNext).toBe(50);
    expect(s.progress).toBe(0);
  });

  it('computes mid-level progress correctly', () => {
    const s = levelSummary(100);
    expect(s.level).toBe(2);
    expect(s.expIntoLevel).toBe(50);
    expect(s.expToNext).toBe(50);
    expect(s.progress).toBeCloseTo(0.5);
  });

  it('returns Charger tier at level 5', () => {
    const s = levelSummary(550);
    expect(s.level).toBe(5);
    expect(s.tier.name).toBe('Charger');
  });

  it('returns Grid Master at level 70+', () => {
    const s = levelSummary(expRequiredToAdvance(69));
    expect(s.level).toBe(70);
    expect(s.tier.name).toBe('Grid Master');
  });
});
