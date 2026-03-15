import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllFeatureFlags } from '@/lib/feature-flags';

export const runtime = 'edge';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const flags = await getAllFeatureFlags();

  return NextResponse.json(flags);
}
