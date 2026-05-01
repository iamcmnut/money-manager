import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { awardExpForApproval, reverseExpForRecord } from '@/lib/exp';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ApproveBody {
  action: 'approve' | 'reject';
  reason?: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const body = (await request.json()) as ApproveBody;
  if (!body.action || !['approve', 'reject'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject".' }, { status: 400 });
  }

  const approvalStatus = body.action === 'approve' ? 'approved' : 'rejected';
  const now = new Date();

  // Snapshot prior expAwarded so we can reverse it on a reject of a previously-
  // approved record. (EXP is only awarded for shared+approved, so any positive
  // value here means the record had crossed that threshold before.)
  const prior = await db
    .select({ expAwarded: chargingRecords.expAwarded })
    .from(chargingRecords)
    .where(eq(chargingRecords.id, id))
    .limit(1);
  if (prior.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  const updated = await db
    .update(chargingRecords)
    .set({
      approvalStatus,
      reviewedAt: now,
      reviewedBy: session.user.id,
      rejectionReason: body.action === 'reject' ? (body.reason ?? null) : null,
      updatedAt: now,
    })
    .where(eq(chargingRecords.id, id))
    .returning();

  if (updated.length === 0) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

  let award = null;
  let reversed = 0;
  if (body.action === 'approve' && updated[0].isShared) {
    award = await awardExpForApproval(db, id);
  } else if (body.action === 'reject' && prior[0].expAwarded > 0) {
    reversed = await reverseExpForRecord(db, id);
  }

  return NextResponse.json({ record: updated[0], award, reversedExp: reversed });
}
