import { format as fnsFormat, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format a date to Vietnamese display: DD/MM/YYYY
 * @example formatDate('2026-08-22') => '22/08/2026'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return fnsFormat(d, 'dd/MM/yyyy', { locale: vi });
}

/**
 * Format a date+time to Vietnamese display: DD/MM/YYYY HH:mm
 * @example formatDateTime('2026-08-22T23:30:00') => '22/08/2026 23:30'
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return fnsFormat(d, 'dd/MM/yyyy HH:mm', { locale: vi });
}

/**
 * Format a date for API transmission: YYYY-MM-DD
 */
export function toISODate(date: Date): string {
  return fnsFormat(date, 'yyyy-MM-dd');
}

export { TIMEZONE };
