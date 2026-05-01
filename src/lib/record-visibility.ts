export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface VisibilityInput {
  isShared: boolean;
  isPreApproved: boolean;
  prevStatus?: ApprovalStatus;
}

/**
 * Determine the approval status for a record based on its sharing flag and
 * the user's pre-approved trust level.
 *
 *  - Private records skip review entirely → 'approved' (but never feed public stats).
 *  - Shared records from pre-approved users skip review → 'approved'.
 *  - Shared records from regular users wait for admin → 'pending'.
 */
export function computeApprovalStatus(input: VisibilityInput): ApprovalStatus {
  if (!input.isShared) return 'approved';
  if (input.isPreApproved) return 'approved';
  return 'pending';
}

/**
 * Whether EXP should be awarded immediately on record submission.
 * Only true when the record skips review AND is shared (private records earn nothing).
 */
export function shouldAwardExpOnSubmit(input: VisibilityInput): boolean {
  return input.isShared && input.isPreApproved;
}

/**
 * On a sharing-flag transition, decide whether the record's approval status
 * should reset (returning the new status), or whether it should be left alone
 * (returning null).
 *
 *  - Private → public (and not pre-approved) → 'pending' (re-enters review).
 *  - Public → private → 'approved' (record stays visible to its owner).
 *  - All other transitions: no change.
 */
export function onSharingChange(args: {
  prevIsShared: boolean;
  nextIsShared: boolean;
  isPreApproved: boolean;
}): ApprovalStatus | null {
  if (args.prevIsShared === args.nextIsShared) return null;
  if (!args.prevIsShared && args.nextIsShared) {
    return args.isPreApproved ? 'approved' : 'pending';
  }
  // public → private
  return 'approved';
}
