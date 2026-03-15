import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Get KV namespace from request context (for API routes)
 * Returns null if not in Cloudflare environment
 */
export async function getKVNamespace(): Promise<KVNamespace | null> {
  try {
    const { env } = await getCloudflareContext();
    if (env?.FEATURE_FLAGS) {
      return env.FEATURE_FLAGS as unknown as KVNamespace;
    }
  } catch {
    // Not in Cloudflare environment
  }
  return null;
}
