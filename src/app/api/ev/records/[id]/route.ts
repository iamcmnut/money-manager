import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { getR2 } from '@/lib/server/r2';
import { chargingRecords, chargingNetworks, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { onSharingChange } from '@/lib/record-visibility';
import { awardExpForApproval, reverseExpForRecord } from '@/lib/exp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await params;
  try {
    const record = await db
      .select({
        id: chargingRecords.id,
        brandId: chargingRecords.brandId,
        brandName: chargingNetworks.name,
        brandColor: chargingNetworks.brandColor,
        chargingDatetime: chargingRecords.chargingDatetime,
        chargedKwh: chargingRecords.chargedKwh,
        costThb: chargingRecords.costThb,
        avgUnitPrice: chargingRecords.avgUnitPrice,
        chargingPowerKw: chargingRecords.chargingPowerKw,
        chargingFinishDatetime: chargingRecords.chargingFinishDatetime,
        mileageKm: chargingRecords.mileageKm,
        notes: chargingRecords.notes,
        approvalStatus: chargingRecords.approvalStatus,
        isShared: chargingRecords.isShared,
        photoKey: chargingRecords.photoKey,
        userCarId: chargingRecords.userCarId,
        expAwarded: chargingRecords.expAwarded,
        createdAt: chargingRecords.createdAt,
      })
      .from(chargingRecords)
      .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .limit(1);
    if (record.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json({ record: record[0] });
  } catch (error) {
    console.error('Failed to fetch charging record:', error);
    return NextResponse.json({ error: 'Failed to fetch charging record' }, { status: 500 });
  }
}

interface UpdateRecordBody {
  brandId?: string;
  chargingDatetime?: string;
  chargedKwh?: number;
  costThb?: number;
  chargingPowerKw?: number | null;
  chargingFinishDatetime?: string | null;
  mileageKm?: number | null;
  notes?: string | null;
  isShared?: boolean;
  photoKey?: string | null;
  userCarId?: string | null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await params;
  const body = (await request.json()) as UpdateRecordBody;

  try {
    const existing = await db
      .select()
      .from(chargingRecords)
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    const record = existing[0];

  const updateData: Partial<typeof chargingRecords.$inferInsert> = {};
  if (body.brandId !== undefined) updateData.brandId = body.brandId;
  if (body.chargingDatetime !== undefined) updateData.chargingDatetime = new Date(body.chargingDatetime);
  if (body.chargedKwh !== undefined) updateData.chargedKwh = body.chargedKwh;
  if (body.costThb !== undefined) updateData.costThb = body.costThb;
  if (body.chargingPowerKw !== undefined) updateData.chargingPowerKw = body.chargingPowerKw;
  if (body.chargingFinishDatetime !== undefined)
    updateData.chargingFinishDatetime = body.chargingFinishDatetime ? new Date(body.chargingFinishDatetime) : null;
  if (body.mileageKm !== undefined) updateData.mileageKm = body.mileageKm;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.photoKey !== undefined) updateData.photoKey = body.photoKey;
  if (body.userCarId !== undefined) updateData.userCarId = body.userCarId;

  const finalKwh = updateData.chargedKwh ?? record.chargedKwh;
  const finalCost = updateData.costThb ?? record.costThb;
  if (updateData.chargedKwh !== undefined || updateData.costThb !== undefined) {
    updateData.avgUnitPrice = finalKwh > 0 ? finalCost / finalKwh : null;
  }

  // Handle sharing transitions: re-route approval status and reverse EXP if needed.
  let didReverseExp = false;
  if (body.isShared !== undefined && body.isShared !== record.isShared) {
    updateData.isShared = body.isShared;
    const userRow = await db
      .select({ isPreApproved: users.isPreApproved })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const isPreApproved = Boolean(userRow[0]?.isPreApproved) || session.user.role === 'admin';
    const nextStatus = onSharingChange({
      prevIsShared: record.isShared,
      nextIsShared: body.isShared,
      isPreApproved,
    });
    if (nextStatus) updateData.approvalStatus = nextStatus;

    if (record.isShared && !body.isShared && record.expAwarded > 0) {
      // public → private: reverse any prior EXP. We do this BEFORE the row update
      // so reverseExpForRecord sees the old expAwarded value.
      await reverseExpForRecord(db, id);
      didReverseExp = true;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

    updateData.updatedAt = new Date();
    const updated = await db
      .update(chargingRecords)
      .set(updateData)
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .returning();

    // If the resulting state is shared + approved, ensure EXP is awarded.
    // Idempotent on `expAwarded`, so a no-op for records that already earned.
    let award = null;
    if (updated[0]?.isShared && updated[0].approvalStatus === 'approved') {
      award = await awardExpForApproval(db, id);
    }

    return NextResponse.json({ record: updated[0], didReverseExp, award });
  } catch (error) {
    console.error('Failed to update charging record:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
      return NextResponse.json({ error: 'Invalid network selected' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update charging record' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const { id } = await params;

  try {
    // Reverse any EXP awarded for this record (writes ledger row), then capture
    // the photoKey before delete so we can purge it from R2 below.
    const existing = await db
      .select({ photoKey: chargingRecords.photoKey, userId: chargingRecords.userId })
      .from(chargingRecords)
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .limit(1);
    if (existing.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    await reverseExpForRecord(db, id);

    const deleted = await db
      .delete(chargingRecords)
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .returning({ id: chargingRecords.id });

    if (deleted.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    if (existing[0].photoKey) {
      const r2 = getR2();
      if (r2) {
        try {
          await r2.delete(existing[0].photoKey);
        } catch (err) {
          console.error('Failed to purge R2 photo:', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete charging record:', error);
    return NextResponse.json({ error: 'Failed to delete charging record' }, { status: 500 });
  }
}
