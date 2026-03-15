import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingNetworks } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const networks = await db
      .select({
        id: chargingNetworks.id,
        name: chargingNetworks.name,
        brandColor: chargingNetworks.brandColor,
        logo: chargingNetworks.logo,
      })
      .from(chargingNetworks)
      .orderBy(asc(chargingNetworks.name));

    return NextResponse.json({ networks });
  } catch (error) {
    console.error('Failed to fetch charging networks:', error);
    return NextResponse.json({ error: 'Failed to fetch charging networks' }, { status: 500 });
  }
}
