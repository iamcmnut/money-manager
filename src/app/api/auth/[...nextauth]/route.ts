import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { createAuthConfig, createDrizzleAdapter } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { getFeatureFlag } from '@/lib/feature-flags';
import { getCloudflareEnv } from '@/lib/cloudflare';
import { users } from '@/lib/db/schema';
import {
  checkRateLimit,
  recordAttempt,
  clearFailedAttempts,
  cleanupOldAttempts,
  getClientIp,
} from '@/lib/rate-limit';

async function getAuthHandlers(request: NextRequest) {
  const db = await getDatabase();
  const cfEnv = getCloudflareEnv() as Record<string, unknown> | null;

  console.log('[Auth] Database available:', !!db);

  const checkGoogleEnabled = () => getFeatureFlag('auth_google');
  const checkCredentialsEnabled = () => getFeatureFlag('auth_credentials');

  const getUserByEmail = db
    ? async (email: string) => {
        console.log('[Auth] Looking up user:', email.substring(0, 3) + '***');

        // Rate limit check before DB lookup
        const rateLimitResult = await checkRateLimit(db, email, 'login');
        if (!rateLimitResult.allowed) {
          console.log('[Auth] Rate limited');
          throw new Error(
            `Too many login attempts. Please try again in ${Math.ceil(rateLimitResult.retryAfterSeconds / 60)} minutes.`
          );
        }

        // Also check IP-based rate limiting
        const ip = getClientIp(request);
        if (ip) {
          const ipRateLimit = await checkRateLimit(db, `ip:${ip}`, 'login');
          if (!ipRateLimit.allowed) {
            console.log('[Auth] IP rate limited:', ip);
            throw new Error(
              `Too many login attempts from this address. Please try again in ${Math.ceil(ipRateLimit.retryAfterSeconds / 60)} minutes.`
            );
          }
        }

        const result = await db
          .select({
            id: users.id,
            email: users.email,
            password: users.password,
            name: users.name,
            role: users.role,
          })
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        console.log('[Auth] User found:', !!result[0]);

        return result[0] ?? null;
      }
    : undefined;

  const config = createAuthConfig({
    adapter: db ? createDrizzleAdapter(db) : undefined,
    googleClientId: (cfEnv?.GOOGLE_CLIENT_ID as string) || undefined,
    googleClientSecret: (cfEnv?.GOOGLE_CLIENT_SECRET as string) || undefined,
    checkGoogleEnabled,
    checkCredentialsEnabled,
    getUserByEmail,
    onCredentialsSignIn: async (email: string, success: boolean) => {
      if (!db) return;
      const ip = getClientIp(request);

      await recordAttempt(db, email, 'login', success, ip);
      if (ip) {
        await recordAttempt(db, `ip:${ip}`, 'login', success, ip);
      }

      if (success) {
        await clearFailedAttempts(db, email, 'login');
        if (ip) {
          await clearFailedAttempts(db, `ip:${ip}`, 'login');
        }
      }

      // Periodically clean up old attempts (~1% of requests)
      if (Math.random() < 0.01) {
        cleanupOldAttempts(db).catch(() => {});
      }
    },
  });

  return NextAuth(config).handlers;
}

export async function GET(request: NextRequest) {
  const { GET } = await getAuthHandlers(request);
  return GET(request);
}

export async function POST(request: NextRequest) {
  const { POST } = await getAuthHandlers(request);
  return POST(request);
}
