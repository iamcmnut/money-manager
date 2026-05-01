import { and, eq, sql } from 'drizzle-orm';
import { chargingRecords, expEvents, users } from './db/schema';
import type { DB } from './consent';

export const EXP_PER_RECORD = 10;
export const EXP_PHOTO_BONUS = 5;
export const EXP_FIRST_NETWORK = 20;

function generateExpId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ExpAward {
  total: number;
  base: number;
  photoBonus: number;
  firstNetworkBonus: number;
}

/**
 * Award EXP for an approved + shared record.
 *
 * Idempotent: a record whose `expAwarded` is already > 0 is a no-op. The
 * first-network bonus dedups against existing `exp_events` rows for the same
 * (user, brand, source='first_network').
 *
 * NOTE: D1 does not support multi-statement transactions in Drizzle. The three
 * writes (insert ledger, update users.expTotal, update record.expAwarded) are
 * sequential. Idempotency on `expAwarded` makes partial-failure recovery safe
 * if the function is retried.
 */
export async function awardExpForApproval(db: DB, recordId: string): Promise<ExpAward | null> {
  const records = await db.select().from(chargingRecords).where(eq(chargingRecords.id, recordId)).limit(1);
  const record = records[0];
  if (!record) return null;
  if (record.expAwarded > 0) return null;
  if (!record.isShared || record.approvalStatus !== 'approved') return null;

  const base = EXP_PER_RECORD;
  const photoBonus = record.photoKey ? EXP_PHOTO_BONUS : 0;

  const priorFirstNetwork = await db
    .select({ id: expEvents.id })
    .from(expEvents)
    .where(
      and(
        eq(expEvents.userId, record.userId),
        eq(expEvents.brandId, record.brandId),
        eq(expEvents.source, 'first_network'),
      ),
    )
    .limit(1);
  const firstNetworkBonus = priorFirstNetwork.length === 0 ? EXP_FIRST_NETWORK : 0;

  const total = base + photoBonus + firstNetworkBonus;
  const now = new Date();

  const eventRows: (typeof expEvents.$inferInsert)[] = [
    {
      id: generateExpId(),
      userId: record.userId,
      recordId: record.id,
      source: 'record_approved',
      delta: base,
      brandId: record.brandId,
      createdAt: now,
    },
  ];
  if (photoBonus > 0) {
    eventRows.push({
      id: generateExpId(),
      userId: record.userId,
      recordId: record.id,
      source: 'photo_bonus',
      delta: photoBonus,
      brandId: record.brandId,
      createdAt: now,
    });
  }
  if (firstNetworkBonus > 0) {
    eventRows.push({
      id: generateExpId(),
      userId: record.userId,
      recordId: record.id,
      source: 'first_network',
      delta: firstNetworkBonus,
      brandId: record.brandId,
      createdAt: now,
    });
  }

  await db.insert(expEvents).values(eventRows);
  await db
    .update(users)
    .set({ expTotal: sql`${users.expTotal} + ${total}` })
    .where(eq(users.id, record.userId));
  await db.update(chargingRecords).set({ expAwarded: total }).where(eq(chargingRecords.id, record.id));

  return { total, base, photoBonus, firstNetworkBonus };
}

/**
 * Reverse a record's previously-awarded EXP. Used on delete or public→private.
 * Writes a negative-delta admin_grant ledger row to preserve audit trail.
 * Idempotent: a record with expAwarded === 0 is a no-op.
 */
export async function reverseExpForRecord(db: DB, recordId: string): Promise<number> {
  const records = await db.select().from(chargingRecords).where(eq(chargingRecords.id, recordId)).limit(1);
  const record = records[0];
  if (!record || record.expAwarded === 0) return 0;

  const reversed = record.expAwarded;

  await db.insert(expEvents).values({
    id: generateExpId(),
    userId: record.userId,
    recordId: record.id,
    source: 'admin_grant',
    delta: -reversed,
    brandId: record.brandId,
    createdAt: new Date(),
  });
  await db
    .update(users)
    .set({ expTotal: sql`${users.expTotal} - ${reversed}` })
    .where(eq(users.id, record.userId));
  await db.update(chargingRecords).set({ expAwarded: 0 }).where(eq(chargingRecords.id, record.id));
  return reversed;
}

export interface ExpComputation {
  base: number;
  photoBonus: number;
  firstNetworkBonus: number;
  total: number;
}

/**
 * Pure helper: given record properties and prior first-network state, compute
 * the EXP award. Used by tests and callers that want to display the breakdown
 * before committing.
 */
export function computeExpAward(input: {
  hasPhoto: boolean;
  hadPriorFirstNetworkBonus: boolean;
}): ExpComputation {
  const base = EXP_PER_RECORD;
  const photoBonus = input.hasPhoto ? EXP_PHOTO_BONUS : 0;
  const firstNetworkBonus = input.hadPriorFirstNetworkBonus ? 0 : EXP_FIRST_NETWORK;
  return { base, photoBonus, firstNetworkBonus, total: base + photoBonus + firstNetworkBonus };
}
