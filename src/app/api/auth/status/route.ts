import { NextResponse } from 'next/server';
import { getFeatureFlag } from '@/lib/feature-flags';

export async function GET() {
  const googleEnabled = await getFeatureFlag('auth_google');
  const credentialsEnabled = await getFeatureFlag('auth_credentials');

  return NextResponse.json({
    providers: {
      google: googleEnabled,
      credentials: credentialsEnabled,
    },
  });
}
