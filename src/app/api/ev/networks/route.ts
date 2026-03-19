import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { chargingNetworks } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
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

    return NextResponse.json({ networks }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch charging networks:', error);
    return NextResponse.json({ error: 'Failed to fetch charging networks' }, { status: 500 });
  }
}
