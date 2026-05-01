import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDatabase } from '@/lib/server';
import type { Database } from '@/lib/server';
import { getFeatureFlag } from '@/lib/feature-flags';
import { users } from '@/lib/db/schema';
import { hashPassword, validatePassword, validateEmail } from '@/lib/password';
import { checkRateLimit, recordAttempt, getClientIp } from '@/lib/rate-limit';
import { generateUserSlug } from '@/lib/slug';

async function generateUniqueSlug(db: Database): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateUserSlug();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.publicSlug, candidate)).limit(1);
    if (existing.length === 0) return candidate;
  }
  // Fallback: append a random suffix to dodge unlikely collisions
  return `${generateUserSlug()}${Math.random().toString(36).slice(2, 5)}`;
}

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

export async function POST(request: Request) {
  const credentialsEnabled = await getFeatureFlag('auth_credentials');
  const registrationEnabled = await getFeatureFlag('auth_registration');

  if (!credentialsEnabled || !registrationEnabled) {
    return NextResponse.json(
      { error: 'Registration is currently disabled' },
      { status: 403 }
    );
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json(
      { error: 'Database not available' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as RegisterBody;
    const { email, password, name } = body;

    // Validate email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Rate limit by IP address for registration
    const ip = getClientIp(request);
    if (ip) {
      const ipRateLimit = await checkRateLimit(db, `ip:${ip}`, 'register');
      if (!ipRateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many registration attempts. Please try again in ${Math.ceil(ipRateLimit.retryAfterSeconds / 60)} minutes.` },
          { status: 429, headers: { 'Retry-After': String(ipRateLimit.retryAfterSeconds) } }
        );
      }
    }

    // Rate limit by email for registration
    const emailRateLimit = await checkRateLimit(db, email, 'register');
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts for this email. Please try again later.` },
        { status: 429, headers: { 'Retry-After': String(emailRateLimit.retryAfterSeconds) } }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      // Record attempt to prevent enumeration attacks via repeated registration
      await recordAttempt(db, email, 'register', false, ip);
      if (ip) {
        await recordAttempt(db, `ip:${ip}`, 'register', false, ip);
      }
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const publicSlug = await generateUniqueSlug(db);

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || null,
      role: 'user',
      publicSlug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
