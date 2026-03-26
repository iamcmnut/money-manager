import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { invalidateCouponCache } from '@/lib/coupon-cache';

interface UpdateCouponBody {
  code?: string;
  networkId?: string;
  descriptionEn?: string | null;
  descriptionTh?: string | null;
  conditionEn?: string | null;
  conditionTh?: string | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as UpdateCouponBody;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.code !== undefined) updates.code = body.code;
    if (body.networkId !== undefined) updates.networkId = body.networkId;
    if (body.descriptionEn !== undefined) updates.descriptionEn = body.descriptionEn || null;
    if (body.descriptionTh !== undefined) updates.descriptionTh = body.descriptionTh || null;
    if (body.conditionEn !== undefined) updates.conditionEn = body.conditionEn || null;
    if (body.conditionTh !== undefined) updates.conditionTh = body.conditionTh || null;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
      }
      updates.startDate = startDate;
    }

    if (body.endDate !== undefined) {
      const endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
      }
      updates.endDate = endDate;
    }

    const result = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Invalidate cache for this coupon's network
    await invalidateCouponCache(result[0].networkId);

    return NextResponse.json({ coupon: result[0] });
  } catch (error) {
    console.error('Failed to update coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const result = await db.delete(coupons).where(eq(coupons.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Invalidate cache for this coupon's network
    await invalidateCouponCache(result[0].networkId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
