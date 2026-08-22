import { describe, it, expect } from 'vitest';
import { calculateMovingAverageCost } from '../utils/costing.js';

describe('Moving Average Cost (Giá vốn bình quân di động)', () => {
  it('initial purchase when old stock is 0 sets cost to purchase cost', () => {
    const cost = calculateMovingAverageCost({
      oldStock: 0,
      oldAverageCost: 0,
      purchasedBaseQty: 100,
      purchaseCostPerBaseUnit: 15000,
    });
    expect(cost).toBe(15000);
  });

  it('calculates weighted average when old stock exists and new goods are purchased at higher price', () => {
    // Old: 100 kg @ 15,000 = 1,500,000 VND
    // New: 100 kg @ 17,000 = 1,700,000 VND
    // Total: 200 kg -> (1.5M + 1.7M) / 200 = 3,200,000 / 200 = 16,000 VND
    const cost = calculateMovingAverageCost({
      oldStock: 100,
      oldAverageCost: 15000,
      purchasedBaseQty: 100,
      purchaseCostPerBaseUnit: 17000,
    });
    expect(cost).toBe(16000);
  });

  it('calculates weighted average with unequal stock quantities', () => {
    // Old: 200 bags @ 80,000 = 16,000,000 VND
    // New: 100 bags @ 85,000 = 8,500,000 VND
    // Total: 300 bags -> 24,500,000 / 300 = 81,666.666 -> 81,667 VND
    const cost = calculateMovingAverageCost({
      oldStock: 200,
      oldAverageCost: 80000,
      purchasedBaseQty: 100,
      purchaseCostPerBaseUnit: 85000,
    });
    expect(cost).toBe(81667);
  });

  it('returns old cost if purchased quantity is 0 or negative', () => {
    const cost = calculateMovingAverageCost({
      oldStock: 50,
      oldAverageCost: 20000,
      purchasedBaseQty: 0,
      purchaseCostPerBaseUnit: 25000,
    });
    expect(cost).toBe(20000);
  });

  it('handles negative or invalid previous stock safely by adopting new price', () => {
    const cost = calculateMovingAverageCost({
      oldStock: -5,
      oldAverageCost: 10000,
      purchasedBaseQty: 50,
      purchaseCostPerBaseUnit: 18000,
    });
    expect(cost).toBe(18000);
  });
});
