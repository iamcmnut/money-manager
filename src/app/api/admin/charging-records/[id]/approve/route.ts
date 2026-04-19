import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { id } = await params;

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

  try {
    const body = (await request.json()) as { action: string };

    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject".' },
        { status: 400 }
      );
    }

    const approvalStatus = body.action === 'approve' ? 'approved' : 'rejected';

    const updated = await db
      .update(chargingRecords)
      .set({
        approvalStatus,
        updatedAt: new Date(),
      })
      .where(eq(chargingRecords.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ record: updated[0] });
  } catch (error) {
    console.error('Failed to update charging record approval:', error);
    return NextResponse.json({ error: 'Failed to update charging record approval' }, { status: 500 });
  }
}
