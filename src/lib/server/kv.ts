/**
 * Get KV namespace from request context (for API routes)
 * Returns null if not in Cloudflare environment
 */
export async function getKVNamespace(): Promise<KVNamespace | null> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    if (env?.FEATURE_FLAGS) {
      return env.FEATURE_FLAGS;
    }
  } catch {
    // Not in Cloudflare environment
  }
  return null;
}
