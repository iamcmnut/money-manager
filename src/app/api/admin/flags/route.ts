import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getKVNamespace } from '@/lib/server';
import {
  getAllFeatureFlags,
  setFeatureFlag,
  getDefaultFlags,
  type FeatureFlag,
} from '@/lib/feature-flags';

export const runtime = 'edge';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kv = await getKVNamespace();
  const flags = await getAllFeatureFlags(kv ?? undefined);

  return NextResponse.json(flags);
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const flags = (await request.json()) as Record<FeatureFlag, boolean>;
    const kv = await getKVNamespace();

    if (kv) {
      // Save to KV storage
      const flagKeys = Object.keys(flags) as FeatureFlag[];
      await Promise.all(flagKeys.map((key) => setFeatureFlag(kv, key, flags[key])));
      return NextResponse.json({ success: true, flags, persisted: true });
    }

    // No KV available, return success but indicate not persisted
    console.log('Feature flags updated (not persisted - no KV):', flags);
    return NextResponse.json({ success: true, flags, persisted: false });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// Seed default flags
export async function POST() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const kv = await getKVNamespace();

  if (!kv) {
    return NextResponse.json({ error: 'KV not available' }, { status: 503 });
  }

  const defaultFlags = getDefaultFlags();
  const flagKeys = Object.keys(defaultFlags) as FeatureFlag[];

  await Promise.all(flagKeys.map((key) => setFeatureFlag(kv, key, defaultFlags[key])));

  return NextResponse.json({ success: true, flags: defaultFlags });
}
