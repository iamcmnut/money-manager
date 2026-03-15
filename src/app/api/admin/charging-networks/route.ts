import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingNetworks } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
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

  try {
    const networks = await db
      .select()
      .from(chargingNetworks)
      .orderBy(desc(chargingNetworks.createdAt));

    return NextResponse.json({ networks });
  } catch (error) {
    console.error('Failed to fetch charging networks:', error);
    return NextResponse.json({ error: 'Failed to fetch charging networks' }, { status: 500 });
  }
}

interface CreateNetworkBody {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  phone?: string;
  brandColor?: string;
}

export async function POST(request: Request) {
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

  try {
    const body = (await request.json()) as CreateNetworkBody;

    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const id = body.slug;
    const now = new Date();

    const network = await db
      .insert(chargingNetworks)
      .values({
        id,
        name: body.name,
        slug: body.slug,
        logo: body.logo || null,
        website: body.website || null,
        phone: body.phone || null,
        brandColor: body.brandColor || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ network: network[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create charging network:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A network with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create charging network' }, { status: 500 });
  }
}
