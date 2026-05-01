import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { getR2 } from '@/lib/server/r2';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const R2_LIST_BATCH = 1000;

async function purgeUserPhotos(userId: string): Promise<number> {
  const r2 = getR2();
  if (!r2) return 0;

  const prefix = `charging-slips/${userId}/`;
  let cursor: string | undefined;
  let purged = 0;
  // R2 list returns up to 1000 keys per page; loop until truncated=false.
  // Each batch is sequential (R2 doesn't yet support cursor parallelism).
  do {
    const result = await r2.list({ prefix, cursor, limit: R2_LIST_BATCH });
    if (result.objects.length === 0) break;
    await Promise.all(result.objects.map((o) => r2.delete(o.key)));
    purged += result.objects.length;
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);
  return purged;
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const userId = session.user.id;

  let purgedPhotos = 0;
  try {
    purgedPhotos = await purgeUserPhotos(userId);
  } catch (err) {
    console.error('Failed to purge user photos from R2:', err);
    // Proceed with user deletion anyway — DB cascade is more important than photo cleanup.
  }

  const deleted = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
  if (deleted.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true, purgedPhotos });
}
