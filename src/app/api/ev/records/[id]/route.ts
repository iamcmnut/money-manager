import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

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
        createdAt: chargingRecords.createdAt,
      })
      .from(chargingRecords)
      .leftJoin(chargingNetworks, eq(chargingRecords.brandId, chargingNetworks.id))
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

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
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as UpdateRecordBody;
    const updateData: Partial<typeof chargingRecords.$inferInsert> = {};

    if (body.brandId !== undefined) updateData.brandId = body.brandId;
    if (body.chargingDatetime !== undefined) updateData.chargingDatetime = new Date(body.chargingDatetime);
    if (body.chargedKwh !== undefined) updateData.chargedKwh = body.chargedKwh;
    if (body.costThb !== undefined) updateData.costThb = body.costThb;
    if (body.chargingPowerKw !== undefined) updateData.chargingPowerKw = body.chargingPowerKw;
    if (body.chargingFinishDatetime !== undefined) updateData.chargingFinishDatetime = body.chargingFinishDatetime ? new Date(body.chargingFinishDatetime) : null;
    if (body.mileageKm !== undefined) updateData.mileageKm = body.mileageKm;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Recalculate avgUnitPrice if kWh or cost changed
    if (updateData.chargedKwh !== undefined || updateData.costThb !== undefined) {
      let finalKwh = updateData.chargedKwh;
      let finalCost = updateData.costThb;

      // If only one value changed, fetch the other from the existing record
      if (finalKwh === undefined || finalCost === undefined) {
        const existing = await db
          .select({ chargedKwh: chargingRecords.chargedKwh, costThb: chargingRecords.costThb })
          .from(chargingRecords)
          .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
          .limit(1);

        if (existing.length === 0) {
          return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        finalKwh = finalKwh ?? existing[0].chargedKwh;
        finalCost = finalCost ?? existing[0].costThb;
      }

      updateData.avgUnitPrice = finalKwh > 0 ? finalCost / finalKwh : null;
    }

    // Reset approval status on edit (unless admin or pre-approved)
    if (session.user.role === 'admin') {
      // Admin edits stay approved
    } else {
      const userRecord = await db.select({ isPreApproved: users.isPreApproved }).from(users).where(eq(users.id, session.user.id)).limit(1);
      if (!userRecord[0]?.isPreApproved) {
        updateData.approvalStatus = 'pending';
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

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ record: updated[0] });
  } catch (error) {
    console.error('Failed to update charging record:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
      return NextResponse.json({ error: 'Invalid network selected' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update charging record' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const deleted = await db
      .delete(chargingRecords)
      .where(and(eq(chargingRecords.id, id), eq(chargingRecords.userId, session.user.id)))
      .returning({ id: chargingRecords.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete charging record:', error);
    return NextResponse.json({ error: 'Failed to delete charging record' }, { status: 500 });
  }
}
