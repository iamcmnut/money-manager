import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks, userCars, users } from '@/lib/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getFeatureFlag } from '@/lib/feature-flags';
import { ConsentRequiredError, requireCurrentConsents } from '@/lib/consent';
import { computeApprovalStatus, shouldAwardExpOnSubmit } from '@/lib/record-visibility';
import { awardExpForApproval } from '@/lib/exp';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const [records, countResult] = await Promise.all([
      db
        .select({
          id: chargingRecords.id,
          brandId: chargingRecords.brandId,
          brandName: chargingNetworks.name,
          brandColor: chargingNetworks.brandColor,
          brandLogo: chargingNetworks.logo,
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
        .where(eq(chargingRecords.userId, session.user.id))
        .orderBy(desc(chargingRecords.chargingDatetime))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chargingRecords)
        .where(eq(chargingRecords.userId, session.user.id)),
    ]);

    return NextResponse.json({ records, total: countResult[0].count, page, limit });
  } catch (error) {
    console.error('Failed to fetch charging records:', error);
    return NextResponse.json({ error: 'Failed to fetch charging records' }, { status: 500 });
  }
}

interface CreateRecordBody {
  brandId: string;
  chargingDatetime: string;
  chargedKwh: number;
  costThb: number;
  chargingPowerKw?: number;
  chargingFinishDatetime?: string;
  mileageKm?: number;
  notes?: string;
  userCarId?: string;
  isShared?: boolean;
  photoKey?: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  try {
    const body = (await request.json()) as CreateRecordBody;
    if (!body.brandId || !body.chargingDatetime || body.chargedKwh === undefined || body.costThb === undefined) {
      return NextResponse.json(
        { error: 'Brand, charging datetime, charged kWh, and cost are required' },
        { status: 400 },
      );
    }

    // Consent gate (skippable in dev via flag)
    const consentGateOn = await getFeatureFlag('legal_consent_gate');
    if (consentGateOn) {
      try {
        await requireCurrentConsents(db, session.user.id);
      } catch (err) {
        if (err instanceof ConsentRequiredError) {
          return NextResponse.json({ error: 'Consent required', missing: err.missing }, { status: 412 });
        }
        throw err;
      }
    }

    // Look up the user's pre-approved trust + visibility default + cars in one go
    const userRow = await db
      .select({ isPreApproved: users.isPreApproved, defaultVisibility: users.defaultRecordVisibility })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    const isPreApproved = Boolean(userRow[0]?.isPreApproved) || session.user.role === 'admin';

    // Auto-select sole car if not provided
    let userCarId: string | null = body.userCarId ?? null;
    if (!userCarId) {
      const cars = await db
        .select({ id: userCars.id, isDefault: userCars.isDefault })
        .from(userCars)
        .where(eq(userCars.userId, session.user.id));
      if (cars.length === 1) userCarId = cars[0].id;
      else if (cars.length > 1) userCarId = cars.find((c) => c.isDefault)?.id ?? null;
    } else {
      // Confirm ownership of the supplied car
      const owned = await db
        .select({ id: userCars.id })
        .from(userCars)
        .where(and(eq(userCars.id, userCarId), eq(userCars.userId, session.user.id)))
        .limit(1);
      if (owned.length === 0) return NextResponse.json({ error: 'Invalid car' }, { status: 400 });
    }

    const isShared = body.isShared ?? userRow[0]?.defaultVisibility === 'public';
    const approvalStatus = computeApprovalStatus({ isShared, isPreApproved });
    const avgUnitPrice = body.chargedKwh > 0 ? body.costThb / body.chargedKwh : null;

    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const inserted = await db
      .insert(chargingRecords)
      .values({
        id,
        userId: session.user.id,
        brandId: body.brandId,
        userCarId,
        chargingDatetime: new Date(body.chargingDatetime),
        chargedKwh: body.chargedKwh,
        costThb: body.costThb,
        avgUnitPrice,
        chargingPowerKw: body.chargingPowerKw ?? null,
        chargingFinishDatetime: body.chargingFinishDatetime ? new Date(body.chargingFinishDatetime) : null,
        mileageKm: body.mileageKm ?? null,
        notes: body.notes ?? null,
        isShared,
        photoKey: body.photoKey ?? null,
        approvalStatus,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    let award = null;
    if (shouldAwardExpOnSubmit({ isShared, isPreApproved })) {
      award = await awardExpForApproval(db, id);
    }

    return NextResponse.json({ record: inserted[0], award }, { status: 201 });
  } catch (error) {
    console.error('Failed to create charging record:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
      return NextResponse.json({ error: 'Invalid brand or car' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create charging record' }, { status: 500 });
  }
}
