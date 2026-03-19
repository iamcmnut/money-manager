import { describe, it, expect } from 'vitest';
import { formatNumber, formatBaht, formatCents, formatBahtCents } from './format';

describe('formatNumber', () => {
  it('should format zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should format positive integers', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('should format large numbers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('should format with decimal places', () => {
    expect(formatNumber(1234.5, 2)).toBe('1,234.50');
  });

  it('should format negative numbers', () => {
    expect(formatNumber(-5000)).toBe('-5,000');
  });

  it('should respect custom decimal places', () => {
    expect(formatNumber(3.14159, 4)).toBe('3.1416');
  });

  it('should default to 0 decimal places', () => {
    expect(formatNumber(99.99)).toBe('100');
  });
});

describe('formatBaht', () => {
  it('should prefix with baht symbol', () => {
    expect(formatBaht(100)).toBe('฿100.00');
  });

  it('should format zero', () => {
    expect(formatBaht(0)).toBe('฿0.00');
  });

  it('should format large amounts with separators', () => {
    expect(formatBaht(1234567.89)).toBe('฿1,234,567.89');
  });

  it('should respect custom decimal places', () => {
    expect(formatBaht(50, 0)).toBe('฿50');
  });
});

describe('formatCents', () => {
  it('should convert cents to formatted number', () => {
    expect(formatCents(123456)).toBe('1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCents(0)).toBe('0.00');
  });

  it('should handle small values', () => {
    expect(formatCents(1)).toBe('0.01');
    expect(formatCents(99)).toBe('0.99');
  });

  it('should handle negative values', () => {
    expect(formatCents(-500)).toBe('-5.00');
  });

  it('should respect custom decimal places', () => {
    expect(formatCents(123456, 0)).toBe('1,235');
  });
});

describe('formatBahtCents', () => {
  it('should convert cents and prefix with baht symbol', () => {
    expect(formatBahtCents(123456)).toBe('฿1,234.56');
  });

  it('should handle zero', () => {
    expect(formatBahtCents(0)).toBe('฿0.00');
  });

  it('should handle small values', () => {
    expect(formatBahtCents(1)).toBe('฿0.01');
  });

  it('should handle large values', () => {
    expect(formatBahtCents(10000000)).toBe('฿100,000.00');
  });

  it('should respect custom decimal places', () => {
    expect(formatBahtCents(123456, 0)).toBe('฿1,235');
  });
});
