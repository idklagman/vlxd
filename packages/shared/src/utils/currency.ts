/**
 * Format a VND amount (stored as integer) to Vietnamese display format.
 * @example formatVND(1250000) => '1.250.000 ₫'
 * @example formatVND(0) => '0 ₫'
 */
export function formatVND(amount: number | bigint): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Parse a VND formatted string back to integer.
 * Strips dots, spaces, and currency symbols.
 * @example parseVND('1.250.000') => 1250000
 * @example parseVND('1.250.000 ₫') => 1250000
 */
export function parseVND(formatted: string): number {
  const cleaned = formatted
    .replace(/[₫đ\s]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .trim();
  const value = parseInt(cleaned, 10);
  if (isNaN(value)) {
    throw new Error(`Không thể chuyển đổi giá trị: ${formatted}`);
  }
  return value;
}

/**
 * Format a number as a compact VND display (no currency symbol).
 * @example formatNumber(1250000) => '1.250.000'
 */
export function formatNumber(value: number | bigint): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}
