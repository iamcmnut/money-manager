import { describe, it, expect } from 'vitest';
import { computeApprovalStatus, shouldAwardExpOnSubmit, onSharingChange } from './record-visibility';

describe('computeApprovalStatus', () => {
  it('private records are immediately approved regardless of trust', () => {
    expect(computeApprovalStatus({ isShared: false, isPreApproved: false })).toBe('approved');
    expect(computeApprovalStatus({ isShared: false, isPreApproved: true })).toBe('approved');
  });

  it('shared records from pre-approved users skip review', () => {
    expect(computeApprovalStatus({ isShared: true, isPreApproved: true })).toBe('approved');
  });

  it('shared records from regular users go to pending', () => {
    expect(computeApprovalStatus({ isShared: true, isPreApproved: false })).toBe('pending');
  });
});

describe('shouldAwardExpOnSubmit', () => {
  it('only awards on shared + pre-approved submission', () => {
    expect(shouldAwardExpOnSubmit({ isShared: true, isPreApproved: true })).toBe(true);
    expect(shouldAwardExpOnSubmit({ isShared: true, isPreApproved: false })).toBe(false);
    expect(shouldAwardExpOnSubmit({ isShared: false, isPreApproved: true })).toBe(false);
    expect(shouldAwardExpOnSubmit({ isShared: false, isPreApproved: false })).toBe(false);
  });
});

describe('onSharingChange', () => {
  it('returns null when isShared does not change', () => {
    expect(onSharingChange({ prevIsShared: true, nextIsShared: true, isPreApproved: false })).toBeNull();
    expect(onSharingChange({ prevIsShared: false, nextIsShared: false, isPreApproved: false })).toBeNull();
  });

  it('private → public sends regular users back to pending', () => {
    expect(onSharingChange({ prevIsShared: false, nextIsShared: true, isPreApproved: false })).toBe('pending');
  });

  it('private → public keeps pre-approved users approved', () => {
    expect(onSharingChange({ prevIsShared: false, nextIsShared: true, isPreApproved: true })).toBe('approved');
  });

  it('public → private resets to approved (no review needed for private)', () => {
    expect(onSharingChange({ prevIsShared: true, nextIsShared: false, isPreApproved: false })).toBe('approved');
    expect(onSharingChange({ prevIsShared: true, nextIsShared: false, isPreApproved: true })).toBe('approved');
  });
});
