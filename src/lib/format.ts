/**
 * Format a number with thousand separators and fixed decimal places.
 * Uses locale-aware formatting for proper separator characters.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a Thai Baht amount with thousand separators.
 * Example: formatBaht(1234.5) → "฿1,234.50"
 */
export function formatBaht(value: number, decimals: number = 2): string {
  return `฿${formatNumber(value, decimals)}`;
}

/**
 * Format a value stored as cents (÷100) with thousand separators.
 * Example: formatCents(123456) → "1,234.56"
 */
export function formatCents(value: number, decimals: number = 2): string {
  return formatNumber(value / 100, decimals);
}

/**
 * Format a value stored as cents as Thai Baht.
 * Example: formatBahtCents(123456) → "฿1,234.56"
 */
export function formatBahtCents(value: number, decimals: number = 2): string {
  return formatBaht(value / 100, decimals);
}
