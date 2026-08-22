import { describe, it, expect } from 'vitest';
import {
  calculateWeightPerBar,
  calculateSteelKg,
  calculateEquivalentBars,
  formatSteelStock,
} from '../utils/steel.js';

describe('Steel Calculation Utilities', () => {
  describe('calculateWeightPerBar', () => {
    it('calculates D10 theoretical bar weight: 0.617 * 11.7 ≈ 7.2189 kg', () => {
      expect(calculateWeightPerBar(0.617, 11.7)).toBe(7.2189);
    });

    it('calculates D16 theoretical bar weight: 1.58 * 11.7 = 18.486 kg', () => {
      expect(calculateWeightPerBar(1.58, 11.7)).toBe(18.486);
    });

    it('calculates D20 theoretical bar weight: 2.47 * 11.7 = 28.899 kg', () => {
      expect(calculateWeightPerBar(2.47, 11.7)).toBe(28.899);
    });
  });

  describe('calculateSteelKg', () => {
    it('calculates total kg for 20 bars of D16 (18.486 kg/bar)', () => {
      expect(calculateSteelKg(20, 18.486)).toBe(369.72);
    });

    it('calculates total kg for 10 bars of D10 (7.2189 kg/bar)', () => {
      expect(calculateSteelKg(10, 7.2189)).toBe(72.189);
    });
  });

  describe('calculateEquivalentBars', () => {
    it('calculates exact bars with 0 remainder: 1848.6kg / 18.486kg = 100 bars', () => {
      const result = calculateEquivalentBars(1848.6, 18.486);
      expect(result.fullBars).toBe(100);
      expect(result.remainingKg).toBe(0);
    });

    it('calculates bars with positive remainder: 1850kg / 18.486kg = 100 bars + 1.4kg', () => {
      const result = calculateEquivalentBars(1850, 18.486);
      expect(result.fullBars).toBe(100);
      expect(result.remainingKg).toBeCloseTo(1.4, 2);
    });

    it('handles zero or negative inputs cleanly', () => {
      const result = calculateEquivalentBars(0, 18.486);
      expect(result.fullBars).toBe(0);
      expect(result.remainingKg).toBe(0);
    });
  });

  describe('formatSteelStock', () => {
    it('formats exact bar stock in Vietnamese format', () => {
      const formatted = formatSteelStock(1848.6, 18.486);
      expect(formatted).toContain('100 cây');
      expect(formatted).toContain('1.848,6 kg');
      expect(formatted).not.toContain('dư');
    });

    it('formats bar stock with remainder without hiding remaining kg', () => {
      const formatted = formatSteelStock(1850, 18.486);
      expect(formatted).toContain('100 cây');
      expect(formatted).toContain('dư');
      expect(formatted).toContain('1.850 kg');
    });
  });
});
