import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';

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
        mileageKm: chargingRecords.mileageKm,
        notes: chargingRecords.notes,
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
    if (body.chargedKwh !== undefined) updateData.chargedKwh = Math.round(body.chargedKwh * 100);
    if (body.costThb !== undefined) updateData.costThb = Math.round(body.costThb * 100);
    if (body.mileageKm !== undefined) updateData.mileageKm = body.mileageKm ? Math.round(body.mileageKm) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Recalculate avgUnitPrice if kWh or cost changed
    if (updateData.chargedKwh !== undefined || updateData.costThb !== undefined) {
      const chargedKwh = updateData.chargedKwh;
      const costThb = updateData.costThb;

      // If only one value changed, we need to get the other from the existing record
      if (chargedKwh !== undefined && costThb !== undefined) {
        updateData.avgUnitPrice = chargedKwh > 0 ? Math.round(costThb / chargedKwh * 100) : null;
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
