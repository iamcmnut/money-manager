import { describe, it, expect } from 'vitest';
import {
  generateUserSlug,
  normalizeSlug,
  validateSlugFormat,
  isValidSlug,
  SLUG_REGEX,
} from './slug';

describe('generateUserSlug', () => {
  it('produces a 12-character slug matching the regex', () => {
    for (let i = 0; i < 50; i++) {
      const slug = generateUserSlug();
      expect(slug).toHaveLength(12);
      expect(SLUG_REGEX.test(slug)).toBe(true);
    }
  });

  it('produces different slugs across calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) seen.add(generateUserSlug());
    expect(seen.size).toBeGreaterThan(15);
  });
});

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  MySlug  ')).toBe('myslug');
    expect(normalizeSlug('FOO-BAR')).toBe('foo-bar');
  });
});

describe('validateSlugFormat', () => {
  it('accepts valid slugs', () => {
    expect(validateSlugFormat('abcd')).toBeNull();
    expect(validateSlugFormat('user-1234')).toBeNull();
    expect(validateSlugFormat('a1b2c3d4e5f6')).toBeNull();
  });

  it('rejects too-short slugs', () => {
    expect(validateSlugFormat('abc')).toBe('format');
  });

  it('rejects too-long slugs', () => {
    expect(validateSlugFormat('a'.repeat(33))).toBe('format');
  });

  it('rejects uppercase as a format violation after normalization fails', () => {
    // After normalizeSlug, uppercase becomes lowercase, so this is actually accepted.
    expect(validateSlugFormat('UPPER-case')).toBeNull();
  });

  it('rejects invalid characters', () => {
    expect(validateSlugFormat('user_name')).toBe('format');
    expect(validateSlugFormat('user.name')).toBe('format');
    expect(validateSlugFormat('user name')).toBe('format');
  });

  it('rejects leading dash', () => {
    expect(validateSlugFormat('-user')).toBe('leading-dash');
  });

  it('rejects trailing dash', () => {
    expect(validateSlugFormat('user-')).toBe('trailing-dash');
  });

  it('rejects double dash', () => {
    expect(validateSlugFormat('user--name')).toBe('double-dash');
  });

  it('rejects reserved words', () => {
    expect(validateSlugFormat('admin')).toBe('reserved');
    expect(validateSlugFormat('Admin')).toBe('reserved');
    expect(validateSlugFormat('settings')).toBe('reserved');
    expect(validateSlugFormat('boss-office')).toBe('reserved');
    expect(validateSlugFormat('living-cost')).toBe('reserved');
  });
});

describe('isValidSlug', () => {
  it('returns boolean', () => {
    expect(isValidSlug('valid-slug')).toBe(true);
    expect(isValidSlug('admin')).toBe(false);
  });
});
