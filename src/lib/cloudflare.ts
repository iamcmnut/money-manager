import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

// Type for Cloudflare environment bindings
export interface CloudflareEnv {
  DB: D1Database;
  FEATURE_FLAGS: KVNamespace;
}

// Global cache for bindings (used in edge runtime)
let cachedEnv: CloudflareEnv | null = null;

/**
 * Get Cloudflare environment bindings
 * Works in both Cloudflare Workers/Pages and local development
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  if (cachedEnv) {
    return cachedEnv;
  }

  // Try to get from global context (Cloudflare Pages)
  if (typeof process !== 'undefined' && process.env) {
    const env = (process as unknown as { env: CloudflareEnv }).env;
    if (env?.DB && env?.FEATURE_FLAGS) {
      cachedEnv = env;
      return cachedEnv;
    }
  }

  // Try getRequestContext from @cloudflare/next-on-pages
  try {
    const cfModule = await import('@cloudflare/next-on-pages');
    const ctx = cfModule.getRequestContext();
    if (ctx?.env) {
      cachedEnv = ctx.env as CloudflareEnv;
      return cachedEnv;
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
