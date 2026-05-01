import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Adapter } from 'next-auth/adapters';
import { users, accounts, sessions, verificationTokens } from './db/schema';
import { verifyPassword } from './password';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'user' | 'admin';
    };
  }

  interface User {
    role?: 'user' | 'admin';
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: 'user' | 'admin';
  }
}

interface AuthConfigOptions {
  adapter?: Adapter;
  googleClientId?: string;
  googleClientSecret?: string;
  checkGoogleEnabled?: () => Promise<boolean>;
  checkCredentialsEnabled?: () => Promise<boolean>;
  getUserByEmail?: (email: string) => Promise<{
    id: string;
    email: string;
    password: string | null;
    name: string | null;
    role: 'user' | 'admin';
  } | null>;
  /** Called after a credentials sign-in attempt (success or failure) */
  onCredentialsSignIn?: (email: string, success: boolean) => Promise<void>;
}

/**
 * Create base Auth.js configuration
 */
function createBaseConfig(options?: AuthConfigOptions): NextAuthConfig {
  const providers = [];

  // Google provider (always added, but sign-in can be blocked)
  providers.push(
    Google({
      clientId: options?.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: options?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
    })
  );

  // Credentials provider for email/password
  providers.push(
    Credentials({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Check if credentials auth is enabled
        if (options?.checkCredentialsEnabled) {
          const isEnabled = await options.checkCredentialsEnabled();
          if (!isEnabled) {
            throw new Error('Credentials authentication is disabled');
          }
        }

        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        if (!options?.getUserByEmail) {
          throw new Error('Database not available');
        }

        const user = await options.getUserByEmail(email);

        if (!user || !user.password) {
          // Record failed attempt (user not found)
          if (options?.onCredentialsSignIn) {
            await options.onCredentialsSignIn(email, false);
          }
          throw new Error('Invalid email or password');
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
          // Record failed attempt (wrong password)
          if (options?.onCredentialsSignIn) {
            await options.onCredentialsSignIn(email, false);
          }
          throw new Error('Invalid email or password');
        }

        // Record successful attempt
        if (options?.onCredentialsSignIn) {
          await options.onCredentialsSignIn(email, true);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    })
  );

  return {
    adapter: options?.adapter,
    providers,
    callbacks: {
      async signIn({ account }) {
        // Check if Google sign-in is enabled
        if (account?.provider === 'google' && options?.checkGoogleEnabled) {
          const isEnabled = await options.checkGoogleEnabled();
          if (!isEnabled) {
            return false;
          }
        }
        return true;
      },
      jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role ?? 'user';
        }
        return token;
      },
      session({ session, token, user }) {
        if (token) {
          session.user.id = token.id as string;
          session.user.role = (token.role as 'user' | 'admin') ?? 'user';
        } else if (user) {
          session.user.id = user.id as string;
          session.user.role = (user.role as 'user' | 'admin') ?? 'user';
        }
        return session;
      },
    },
    events: {
      async createUser({ user }) {
        // Lazy slug assignment for OAuth signups: the DrizzleAdapter inserts the
        // user before our app code runs, so we backfill the slug here.
        if (!user.id) return;
        try {
          const { getDatabase } = await import('@/lib/server');
          const { generateUserSlug } = await import('@/lib/slug');
          const { eq } = await import('drizzle-orm');
          const { users: usersTable } = await import('@/lib/db/schema');
          const db = await getDatabase();
          if (!db) return;
          for (let attempt = 0; attempt < 10; attempt++) {
            const candidate = generateUserSlug();
            const existing = await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(eq(usersTable.publicSlug, candidate))
              .limit(1);
            if (existing.length === 0) {
              await db.update(usersTable).set({ publicSlug: candidate }).where(eq(usersTable.id, user.id));
              return;
            }
          }
        } catch (err) {
          console.error('Failed to assign public slug on createUser:', err);
        }
      },
    },
    pages: {
      signIn: '/en/auth/signin',
      error: '/en/auth/error',
    },
    session: {
      // Always use JWT for credentials provider compatibility
      strategy: 'jwt',
    },
    trustHost: true,
  };
}

/**
 * Create Auth.js configuration with optional database adapter and feature flag checks
 */
export function createAuthConfig(options?: AuthConfigOptions): NextAuthConfig {
  return createBaseConfig(options);
}

/**
 * Create Drizzle adapter for D1
 */
export function createDrizzleAdapter(db: Parameters<typeof DrizzleAdapter>[0]): Adapter {
  // Schema tables use snake_case column names, but the adapter types expect camelCase.
  // The adapter handles the mapping correctly at runtime via Drizzle's column definitions.
  return DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as Adapter;
}

// Default export using JWT strategy (no feature flag check - for middleware/static usage)
export const { handlers, signIn, signOut, auth } = NextAuth(createBaseConfig());
