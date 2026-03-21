import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllFeatureFlags, type FeatureFlag } from '@/lib/feature-flags';
import { getKV } from '@/lib/cloudflare';

const VALID_FLAGS: FeatureFlag[] = [
  'module_ev',
  'module_living_cost',
  'module_savings',
  'auth_google',
  'auth_credentials',
  'auth_registration',
];

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const flags = await getAllFeatureFlags();

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

  const body = (await request.json()) as { flag: string; enabled: boolean };
  const { flag, enabled } = body;

  if (!VALID_FLAGS.includes(flag as FeatureFlag)) {
    return NextResponse.json({ error: 'Invalid flag' }, { status: 400 });
  }

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  const kv = getKV();
  if (!kv) {
    return NextResponse.json(
      { error: 'KV not available. Flags can only be toggled in production.' },
      { status: 503 }
    );
  }

  await kv.put(flag, String(enabled));

  return NextResponse.json({ flag, enabled });
}
