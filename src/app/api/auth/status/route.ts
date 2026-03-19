import { NextResponse } from 'next/server';
import { getFeatureFlag } from '@/lib/feature-flags';

export async function GET() {
  const googleEnabled = getFeatureFlag('auth_google');
  const credentialsEnabled = getFeatureFlag('auth_credentials');
  const registrationEnabled = getFeatureFlag('auth_registration');

  return NextResponse.json({
    providers: {
      google: googleEnabled,
      credentials: credentialsEnabled,
    },
    registration: registrationEnabled,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
