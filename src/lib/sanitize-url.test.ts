import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './sanitize-url';

describe('sanitizeUrl', () => {
  it('returns url for valid http URL', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('returns url for valid https URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns url for https URL with path', () => {
    expect(sanitizeUrl('https://example.com/path/to/page')).toBe('https://example.com/path/to/page');
  });

  it('returns url for https URL with query string', () => {
    expect(sanitizeUrl('https://example.com?foo=bar')).toBe('https://example.com?foo=bar');
  });

  it('returns null for javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('returns null for data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<h1>Hello</h1>')).toBeNull();
  });

  it('returns null for ftp: protocol', () => {
    expect(sanitizeUrl('ftp://example.com')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  it('returns null for file: protocol', () => {
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });
});
