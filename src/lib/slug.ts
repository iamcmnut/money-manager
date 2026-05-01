const SLUG_LENGTH = 12;
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const SLUG_REGEX = /^[a-z0-9-]{4,32}$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  '_next',
  'about',
  'admin',
  'api',
  'auth',
  'boss-office',
  'ev',
  'help',
  'images',
  'legal',
  'living-cost',
  'login',
  'logos',
  'logout',
  'me',
  'privacy',
  'public',
  'register',
  'savings',
  'settings',
  'signin',
  'signout',
  'signup',
  'static',
  'support',
  'terms',
  'u',
  'user',
  'users',
]);

export function generateUserSlug(): string {
  let slug = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_CHARS[Math.floor(Math.random() * SLUG_CHARS.length)];
  }
  return slug;
}

export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase();
}

export type SlugInvalidReason = 'format' | 'reserved' | 'leading-dash' | 'trailing-dash' | 'double-dash';

export function validateSlugFormat(input: string): SlugInvalidReason | null {
  const slug = normalizeSlug(input);
  if (!SLUG_REGEX.test(slug)) return 'format';
  if (slug.startsWith('-')) return 'leading-dash';
  if (slug.endsWith('-')) return 'trailing-dash';
  if (slug.includes('--')) return 'double-dash';
  if (RESERVED_SLUGS.has(slug)) return 'reserved';
  return null;
}

export function isValidSlug(input: string): boolean {
  return validateSlugFormat(input) === null;
}
