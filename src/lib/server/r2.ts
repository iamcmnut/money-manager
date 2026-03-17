function getCloudflareContextFromGlobal(): { env?: Record<string, unknown> } | undefined {
  return (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined;
}

export function getR2(): R2Bucket | null {
  try {
    const ctx = getCloudflareContextFromGlobal();
    if (ctx?.env?.R2) {
      return ctx.env.R2 as unknown as R2Bucket;
    }
  } catch {
    // Not running in Cloudflare environment
  }
  return null;
}
