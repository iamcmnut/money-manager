import { describe, it, expect } from 'vitest';
import { computeExpAward, EXP_PER_RECORD, EXP_PHOTO_BONUS, EXP_FIRST_NETWORK } from './exp';

describe('computeExpAward', () => {
  it('first record on a network with photo gives full 35', () => {
    const r = computeExpAward({ hasPhoto: true, hadPriorFirstNetworkBonus: false });
    expect(r.base).toBe(EXP_PER_RECORD);
    expect(r.photoBonus).toBe(EXP_PHOTO_BONUS);
    expect(r.firstNetworkBonus).toBe(EXP_FIRST_NETWORK);
    expect(r.total).toBe(35);
  });

  it('first record on a network without photo gives 30', () => {
    const r = computeExpAward({ hasPhoto: false, hadPriorFirstNetworkBonus: false });
    expect(r.total).toBe(30);
    expect(r.photoBonus).toBe(0);
  });

  it('repeat record on same network with photo gives 15', () => {
    const r = computeExpAward({ hasPhoto: true, hadPriorFirstNetworkBonus: true });
    expect(r.firstNetworkBonus).toBe(0);
    expect(r.total).toBe(15);
  });

  it('repeat record without photo gives base 10', () => {
    const r = computeExpAward({ hasPhoto: false, hadPriorFirstNetworkBonus: true });
    expect(r.total).toBe(EXP_PER_RECORD);
  });
});
