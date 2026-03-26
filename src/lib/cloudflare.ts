import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

// Type for Cloudflare environment bindings
export interface CloudflareEnv {
  DB: D1Database;
  FEATURE_FLAGS: KVNamespace;
  R2: R2Bucket;
  R2_PUBLIC_URL?: string;
}

function getCloudflareContextFromGlobal(): { env?: Record<string, unknown> } | undefined {
  return (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined;
}

/**
 * Get Cloudflare environment bindings
 * Works in both Cloudflare Workers/Pages and local development
 */
export function getCloudflareEnv(): CloudflareEnv | null {
  try {
    const ctx = getCloudflareContextFromGlobal();
    if (ctx?.env?.DB) {
      return ctx.env as unknown as CloudflareEnv;
    }
  } catch {
    // Not running in Cloudflare environment
  }

  return null;
}

/**
 * Get D1 database instance
 */
export function getDb() {
  const env = getCloudflareEnv();
  if (!env?.DB) {
    return null;
  }
  return drizzle(env.DB, { schema });
}

/**
 * Get KV namespace for feature flags
 */
export function getKV(): KVNamespace | null {
  const env = getCloudflareEnv();
  return env?.FEATURE_FLAGS ?? null;
}

/**
 * Check if running in Cloudflare environment
 */
export function isCloudflareEnv(): boolean {
  return getCloudflareEnv() !== null;
}

/**
 * Get R2 public URL for serving uploaded files directly from CDN.
 * Production: from Cloudflare env vars (wrangler.toml [vars])
 * Local dev: from process.env (`.env.local`)
 */
export function getR2PublicUrl(): string | null {
  const env = getCloudflareEnv();
  if (env?.R2_PUBLIC_URL) {
    return env.R2_PUBLIC_URL;
  }
  return process.env.R2_PUBLIC_URL || null;
}
