import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className merge utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid');
    expect(result).toBe('base valid');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle object syntax', () => {
    const result = cn({
      base: true,
      active: true,
      disabled: false,
    });
    expect(result).toBe('base active');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting utilities
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle multiple Tailwind color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should preserve non-conflicting Tailwind classes', () => {
    const result = cn('text-red-500 font-bold', 'bg-blue-500');
    expect(result).toBe('text-red-500 font-bold bg-blue-500');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      ['array-class'],
      { conditional: true },
      undefined,
      'final'
    );
    expect(result).toBe('base array-class conditional final');
  });
});
