import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

// Type for Cloudflare environment bindings
export interface CloudflareEnv {
  DB: D1Database;
  FEATURE_FLAGS: KVNamespace;
}

/**
 * Get Cloudflare environment bindings
 * Works in both Cloudflare Workers/Pages and local development
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    const { env } = await getCloudflareContext();
    if (env?.DB) {
      return env as unknown as CloudflareEnv;
    }
  } catch {
    // Not running in Cloudflare environment
  }

  return null;
}

/**
 * Get D1 database instance
 */
export async function getDb() {
  const env = await getCloudflareEnv();
  if (!env?.DB) {
    return null;
  }
  return drizzle(env.DB, { schema });
}

/**
 * Get KV namespace for feature flags
 */
export async function getKV(): Promise<KVNamespace | null> {
  const env = await getCloudflareEnv();
  return env?.FEATURE_FLAGS ?? null;
}

/**
 * Check if running in Cloudflare environment
 */
export async function isCloudflareEnv(): Promise<boolean> {
  return (await getCloudflareEnv()) !== null;
}
