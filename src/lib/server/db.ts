import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create a database instance from D1 binding
 */
export function createDatabase(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

function getCloudflareContextFromGlobal(): { env?: Record<string, unknown> } | undefined {
  return (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined;
}

/**
 * Get database from request context (for API routes)
 * Returns null if not in Cloudflare environment
 */
export function getDatabase(): Database | null {
  try {
    const ctx = getCloudflareContextFromGlobal();
    if (ctx?.env?.DB) {
      return createDatabase(ctx.env.DB as unknown as D1Database);
    }
  } catch (error) {
    console.log('[DB] Error getting context:', error);
  }
  return null;
}
