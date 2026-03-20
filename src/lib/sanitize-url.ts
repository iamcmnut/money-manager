export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) return url;
    return null;
  } catch {
    return null;
  }
}
