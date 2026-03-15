import { NextResponse } from 'next/server';
import { getFeatureFlag } from '@/lib/feature-flags';

export const runtime = 'edge';

export async function GET() {
  const googleEnabled = getFeatureFlag('auth_google');
  const credentialsEnabled = getFeatureFlag('auth_credentials');

  return NextResponse.json({
    providers: {
      google: googleEnabled,
      credentials: credentialsEnabled,
    },
  });
}
