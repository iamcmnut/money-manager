import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create a database instance from D1 binding
 */
export function createDatabase(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

/**
 * Get database from request context (for API routes)
 * Returns null if not in Cloudflare environment
 */
export async function getDatabase(): Promise<Database | null> {
  try {
    const { env } = await getCloudflareContext();
    if (env?.DB) {
      return createDatabase(env.DB as unknown as D1Database);
    }
  } catch (error) {
    console.log('[DB] Error getting context:', error);
  }
  return null;
}
