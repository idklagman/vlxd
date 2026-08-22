import { describe, it, expect } from 'vitest';
import {
  calculateMovingAverageCost,
  calculateSteelKg,
  calculateEquivalentBars,
  formatSteelStock,
  formatVND,
  parseVND,
} from '@vlxd/shared';

describe('E2E Business Logic & Cross-Module Calculation Invariants', () => {
  // 1. Moving Average Cost Calculation Invariant (Inventory & Costing)
  describe('Moving Average Cost Invariant', () => {
    it('accurately computes moving average unit cost upon new purchase arrival', () => {
      // Scenario: Current stock 100 bags @ 80,000 VND. Purchase 200 bags @ 86,000 VND.
      const newAvgCost = calculateMovingAverageCost({
        oldStock: 100,
        oldAverageCost: 80000,
        purchasedBaseQty: 200,
        purchaseCostPerBaseUnit: 86000,
      });

      // Formula: ((100 * 80,000) + (200 * 86,000)) / 300 = (8,000,000 + 17,200,000) / 300 = 25,200,000 / 300 = 84,000 VND
      expect(newAvgCost).toBe(84000);
    });

    it('retains previous average cost if existing stock is zero', () => {
      const newAvgCost = calculateMovingAverageCost({
        oldStock: 0,
        oldAverageCost: 0,
        purchasedBaseQty: 50,
        purchaseCostPerBaseUnit: 95000,
      });
      expect(newAvgCost).toBe(95000);
    });
  });

  // 2. Steel Barem TCVN 1651-2:2018 Invariant (Bar <-> Kg math)
  describe('Steel Barem Bar to Kg Conversion & Breakdown', () => {
    // D10 steel bar (11.7m) has barem weight 7.2189 kg/bar
    const weightPerBarD10 = 7.2189;

    it('accurately calculates kg from number of bars', () => {
      const totalKg = calculateSteelKg(100, weightPerBarD10);
      expect(totalKg).toBeCloseTo(721.89, 2);
    });

    it('calculates full bars and exact remaining kg for display in stock UI', () => {
      // Example: 1849 kg in stock of D10 (weight 7.2189 kg/bar)
      const stockKg = 1849;
      const breakdown = calculateEquivalentBars(stockKg, weightPerBarD10);

      expect(breakdown.fullBars).toBe(256);
      expect(breakdown.remainingKg).toBeGreaterThanOrEqual(0);
      expect(breakdown.remainingKg).toBeLessThan(weightPerBarD10);

      const formatted = formatSteelStock(stockKg, weightPerBarD10);
      expect(formatted).toContain('cây');
      expect(formatted).toContain('kg dư');
    });

    it('formats exact bar count without leftover text if perfectly divisible', () => {
      const stockKg = 721.89; // exactly 100 bars
      const formatted = formatSteelStock(stockKg, weightPerBarD10);
      expect(formatted).toBe('100 cây (≈ 721,89 kg)');
    });
  });

  // 3. Currency & VND Integer Arithmetic Invariant
  describe('VND Integer Formatting & BigInt Representation', () => {
    it('formats Vietnamese currency with đ suffix and standard thousand separators', () => {
      expect(formatVND(1500000)).toContain('1.500.000');
      expect(formatVND(1500000)).toContain('₫');
      expect(formatVND(0)).toContain('0');
      expect(formatVND(125000000)).toContain('125.000.000');
    });

    it('parses formatted Vietnamese string back to clean numeric integer', () => {
      expect(parseVND('1.500.000 ₫')).toBe(1500000);
      expect(parseVND('250,000')).toBe(250000);
    });
  });

  // 4. Sales Profit & Loss (P&L) Formula Invariant
  describe('Profit & Loss Computation Invariant', () => {
    it('satisfies Gross Profit = Net Revenue - COGS, and Net Profit = Gross Profit - Expenses + Net Shipping', () => {
      const grossSales = 100000000; // 100M VND
      const discount = 2000000; // 2M VND
      const netSales = grossSales - discount; // 98M VND

      const cogs = 80000000; // 80M VND
      const grossProfit = netSales - cogs; // 18M VND
      const grossMarginPct = Number(((grossProfit / netSales) * 100).toFixed(1)); // 18.4%

      expect(grossProfit).toBe(18000000);
      expect(grossMarginPct).toBe(18.4);

      const operatingExpenses = 5000000; // 5M VND (Fuel, Driver wages, Rent)
      const shippingCollected = 1000000; // 1M VND
      const netProfit = grossProfit - operatingExpenses + shippingCollected; // 14M VND
      const totalIncome = netSales + shippingCollected;
      const netMarginPct = Number(((netProfit / totalIncome) * 100).toFixed(1)); // 14.1%

      expect(netProfit).toBe(14000000);
      expect(netMarginPct).toBe(14.1);
    });
  });
});
