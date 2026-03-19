import { and, eq, gte, sql } from 'drizzle-orm';
import { loginAttempts } from './db/schema';
import type { Database } from './server';

interface RateLimitConfig {
  /** Max failed attempts before lockout */
  maxAttempts: number;
  /** Time window in seconds to count attempts */
  windowSeconds: number;
  /** Lockout duration in seconds after max attempts exceeded */
  lockoutSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Remaining attempts before lockout */
  remaining: number;
  /** Seconds until lockout expires (0 if not locked) */
  retryAfterSeconds: number;
}

const LOGIN_LIMITS: RateLimitConfig = {
  maxAttempts: 5,
  windowSeconds: 15 * 60, // 15 minutes
  lockoutSeconds: 15 * 60, // 15 minutes
};

const REGISTER_LIMITS: RateLimitConfig = {
  maxAttempts: 3,
  windowSeconds: 60 * 60, // 1 hour
  lockoutSeconds: 60 * 60, // 1 hour
};

/**
 * Check if an identifier (email or IP) is rate-limited for a given action.
 */
export async function checkRateLimit(
  db: Database,
  identifier: string,
  attemptType: 'login' | 'register'
): Promise<RateLimitResult> {
  const config = attemptType === 'login' ? LOGIN_LIMITS : REGISTER_LIMITS;
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier.toLowerCase()),
        eq(loginAttempts.attemptType, attemptType),
        eq(loginAttempts.success, false),
        gte(loginAttempts.attemptedAt, windowStart)
      )
    );

  const failedCount = result[0]?.count ?? 0;
  const remaining = Math.max(0, config.maxAttempts - failedCount);
  const allowed = failedCount < config.maxAttempts;

  let retryAfterSeconds = 0;
  if (!allowed) {
    // Find the most recent failed attempt to calculate lockout expiry
    const lastAttempt = await db
      .select({ attemptedAt: loginAttempts.attemptedAt })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.identifier, identifier.toLowerCase()),
          eq(loginAttempts.attemptType, attemptType),
          eq(loginAttempts.success, false),
          gte(loginAttempts.attemptedAt, windowStart)
        )
      )
      .orderBy(sql`${loginAttempts.attemptedAt} desc`)
      .limit(1);

    if (lastAttempt[0]) {
      const lockoutEnd = lastAttempt[0].attemptedAt.getTime() + config.lockoutSeconds * 1000;
      retryAfterSeconds = Math.max(0, Math.ceil((lockoutEnd - Date.now()) / 1000));
    }
  }

  return { allowed, remaining, retryAfterSeconds };
}

/**
 * Record a login/register attempt.
 */
export async function recordAttempt(
  db: Database,
  identifier: string,
  attemptType: 'login' | 'register',
  success: boolean,
  ipAddress?: string | null
): Promise<void> {
  await db.insert(loginAttempts).values({
    id: crypto.randomUUID(),
    identifier: identifier.toLowerCase(),
    attemptType,
    success,
    ipAddress: ipAddress ?? null,
    attemptedAt: new Date(),
  });
}

/**
 * Clear failed attempts for an identifier after successful login.
 */
export async function clearFailedAttempts(
  db: Database,
  identifier: string,
  attemptType: 'login' | 'register'
): Promise<void> {
  await db
    .delete(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier.toLowerCase()),
        eq(loginAttempts.attemptType, attemptType),
        eq(loginAttempts.success, false)
      )
    );
}

/**
 * Clean up old attempts (call periodically or on each request).
 * Removes attempts older than 24 hours.
 */
export async function cleanupOldAttempts(db: Database): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db
    .delete(loginAttempts)
    .where(sql`${loginAttempts.attemptedAt} < ${cutoff}`);
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string | null {
  // Cloudflare Workers provides the real IP
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return null;
}
