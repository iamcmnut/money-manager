import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getR2 } from '@/lib/server/r2';
import { getDatabase } from '@/lib/server';
import { chargingRecords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { key } = await params;
  const objectKey = key.join('/');

  // Charging slips: gated to owner / admin / approved+shared
  if (objectKey.startsWith('charging-slips/')) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDatabase();
    if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

    const records = await db
      .select({
        userId: chargingRecords.userId,
        isShared: chargingRecords.isShared,
        approvalStatus: chargingRecords.approvalStatus,
      })
      .from(chargingRecords)
      .where(eq(chargingRecords.photoKey, objectKey))
      .limit(1);

    const allow =
      records.length === 0 // orphaned key (newly uploaded, not yet attached) — only the uploader's prefix
        ? objectKey.startsWith(`charging-slips/${session.user.id}/`) || session.user.role === 'admin'
        : records[0].userId === session.user.id ||
          session.user.role === 'admin' ||
          (records[0].isShared && records[0].approvalStatus === 'approved');

    if (!allow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const r2 = getR2();
  if (!r2) return NextResponse.json({ error: 'Storage not available' }, { status: 503 });

  try {
    const object = await r2.get(objectKey);
    if (!object) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const arrayBuffer = await object.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to get file:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}
