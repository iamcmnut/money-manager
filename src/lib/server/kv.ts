function getCloudflareContextFromGlobal(): { env?: Record<string, unknown> } | undefined {
  return (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined;
}

/**
 * Get KV namespace from request context (for API routes)
 * Returns null if not in Cloudflare environment
 */
export function getKVNamespace(): KVNamespace | null {
  try {
    const ctx = getCloudflareContextFromGlobal();
    if (ctx?.env?.FEATURE_FLAGS) {
      return ctx.env.FEATURE_FLAGS as unknown as KVNamespace;
    }
  } catch {
    // Not in Cloudflare environment
  }
  return null;
}
