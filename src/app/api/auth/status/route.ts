import { NextResponse } from 'next/server';
import { getKVNamespace } from '@/lib/server';
import { getFeatureFlag } from '@/lib/feature-flags';

export const runtime = 'edge';

export async function GET() {
  const kv = await getKVNamespace();

  const [googleEnabled, credentialsEnabled] = await Promise.all([
    getFeatureFlag(kv ?? undefined, 'auth_google'),
    getFeatureFlag(kv ?? undefined, 'auth_credentials'),
  ]);

  return NextResponse.json({
    providers: {
      google: googleEnabled,
      credentials: credentialsEnabled,
    },
  });
}
