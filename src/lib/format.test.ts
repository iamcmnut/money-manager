import { describe, it, expect } from 'vitest';
import { formatNumber, formatBaht } from './format';

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
