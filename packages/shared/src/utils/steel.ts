/**
 * Utility functions for Steel (Sắt thép) calculations
 */

/**
 * Standard Hòa Phát steel bar length in meters (11.7m)
 */
export const DEFAULT_BAR_LENGTH = 11.7;

/**
 * Calculate theoretical weight per bar (kg/cây) given nominal weight per meter (kg/m) and length (m).
 * Formula: weightPerBar = weightPerMeter * length
 * @param weightPerMeter Nominal weight per meter in kg/m (e.g. 1.58 for D16)
 * @param length Length of the bar in meters (default 11.7m)
 * @returns Theoretical bar weight in kg (e.g. 18.486 for D16 11.7m)
 */
export function calculateWeightPerBar(weightPerMeter: number, length: number = DEFAULT_BAR_LENGTH): number {
  return Number((weightPerMeter * length).toFixed(4));
}

/**
 * Calculate total kg from number of steel bars.
 * Formula: totalKg = bars * weightPerBar
 */
export function calculateSteelKg(bars: number, weightPerBar: number): number {
  return Number((bars * weightPerBar).toFixed(4));
}

/**
 * Calculate equivalent steel bars and remaining kg from stock in kg.
 * Formula:
 * fullBars = floor(stockKg / weightPerBar)
 * remainingKg = stockKg - (fullBars * weightPerBar)
 */
export function calculateEquivalentBars(stockKg: number, weightPerBar: number): { fullBars: number; remainingKg: number } {
  if (weightPerBar <= 0) return { fullBars: 0, remainingKg: stockKg };
  const EPSILON = 1e-6;
  const fullBars = Math.floor((stockKg + EPSILON) / weightPerBar);
  const remainingKg = Math.max(0, Number((stockKg - fullBars * weightPerBar).toFixed(4)));
  return { fullBars, remainingKg };
}

/**
 * Format steel stock for user display in Vietnamese.
 * @example formatSteelStock(1848.6, 18.486) => "100 cây (≈ 1.848,6 kg)"
 * @example formatSteelStock(1850, 18.486) => "100 cây + 1,4 kg dư (≈ 1.850 kg)"
 */
export function formatSteelStock(stockKg: number, weightPerBar: number): string {
  const { fullBars, remainingKg } = calculateEquivalentBars(stockKg, weightPerBar);
  const formattedKg = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(stockKg);

  if (remainingKg > 0.001) {
    const formattedRemainder = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(remainingKg);
    return `${fullBars} cây + ${formattedRemainder} kg dư (≈ ${formattedKg} kg)`;
  }

  return `${fullBars} cây (≈ ${formattedKg} kg)`;
}
