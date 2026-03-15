import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { createAuthConfig, createDrizzleAdapter } from '@/lib/auth';
import { getDatabase, getKVNamespace } from '@/lib/server';
import { getFeatureFlag } from '@/lib/feature-flags';
import { users } from '@/lib/db/schema';

export const runtime = 'edge';

async function getAuthHandlers() {
  const db = await getDatabase();
  const kv = await getKVNamespace();

  const checkGoogleEnabled = async () => {
    return getFeatureFlag(kv ?? undefined, 'auth_google');
  };

  const checkCredentialsEnabled = async () => {
    return getFeatureFlag(kv ?? undefined, 'auth_credentials');
  };

  const getUserByEmail = db
    ? async (email: string) => {
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

        return result[0] ?? null;
      }
    : undefined;

  const config = createAuthConfig({
    adapter: db ? createDrizzleAdapter(db) : undefined,
    checkGoogleEnabled,
    checkCredentialsEnabled,
    getUserByEmail,
  });

  return NextAuth(config).handlers;
}

export async function GET(request: NextRequest) {
  const { GET } = await getAuthHandlers();
  return GET(request);
}

export async function POST(request: NextRequest) {
  const { POST } = await getAuthHandlers();
  return POST(request);
}
