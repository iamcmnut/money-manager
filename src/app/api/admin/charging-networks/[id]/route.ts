import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingNetworks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
    const network = await db
      .select()
      .from(chargingNetworks)
      .where(eq(chargingNetworks.id, id))
      .limit(1);

    if (network.length === 0) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    return NextResponse.json({ network: network[0] });
  } catch (error) {
    console.error('Failed to fetch charging network:', error);
    return NextResponse.json({ error: 'Failed to fetch charging network' }, { status: 500 });
  }
}

interface UpdateNetworkBody {
  name?: string;
  slug?: string;
  logo?: string | null;
  website?: string | null;
  phone?: string | null;
  brandColor?: string | null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
    const body = (await request.json()) as UpdateNetworkBody;
    const updateData: Partial<typeof chargingNetworks.$inferInsert> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.logo !== undefined) updateData.logo = body.logo;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.brandColor !== undefined) updateData.brandColor = body.brandColor;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const updated = await db
      .update(chargingNetworks)
      .set(updateData)
      .where(eq(chargingNetworks.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    return NextResponse.json({ network: updated[0] });
  } catch (error) {
    console.error('Failed to update charging network:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'A network with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update charging network' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
    const deleted = await db
      .delete(chargingNetworks)
      .where(eq(chargingNetworks.id, id))
      .returning({ id: chargingNetworks.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete charging network:', error);
    if (error instanceof Error && error.message.includes('FOREIGN KEY constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete network with existing charging records' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to delete charging network' }, { status: 500 });
  }
}
