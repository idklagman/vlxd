import { describe, it, expect } from 'vitest';
import { formatVND, parseVND, formatNumber } from '../utils/currency.js';

describe('currency utils', () => {
  describe('formatVND', () => {
    it('formats zero', () => {
      expect(formatVND(0)).toContain('0');
    });

    it('formats positive amount', () => {
      const result = formatVND(1250000);
      // Vietnamese format uses dot separators
      expect(result).toContain('1.250.000');
    });

    it('formats large amount', () => {
      const result = formatVND(500000000);
      expect(result).toContain('500.000.000');
    });
  });

  describe('parseVND', () => {
    it('parses formatted string', () => {
      expect(parseVND('1.250.000')).toBe(1250000);
    });

    it('parses string with currency symbol', () => {
      expect(parseVND('1.250.000 ₫')).toBe(1250000);
    });

    it('parses zero', () => {
      expect(parseVND('0')).toBe(0);
    });

    it('throws on invalid input', () => {
      expect(() => parseVND('abc')).toThrow();
    });
  });

  describe('formatNumber', () => {
    it('formats with dot separator', () => {
      expect(formatNumber(1250000)).toBe('1.250.000');
    });
  });
});
