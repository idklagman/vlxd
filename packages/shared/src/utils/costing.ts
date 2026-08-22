/**
 * Moving Average Cost (Giá vốn bình quân gia quyền di động) calculation utility.
 * Used when goods are received into warehouse to update cost per base unit.
 */

export interface CostingInput {
  oldStock: number;
  oldAverageCost: number;
  purchasedBaseQty: number;
  purchaseCostPerBaseUnit: number;
}

/**
 * Calculate the new moving average cost per base unit (in VND).
 *
 * Formula:
 * NewAverageCost = (OldStock * OldCost + PurchasedQty * PurchaseCost) / (OldStock + PurchasedQty)
 *
 * @param input Costing calculation parameters
 * @returns New average unit cost rounded to integer VND (BIGINT format)
 */
export function calculateMovingAverageCost({
  oldStock,
  oldAverageCost,
  purchasedBaseQty,
  purchaseCostPerBaseUnit,
}: CostingInput): number {
  if (purchasedBaseQty <= 0) {
    return Math.max(0, Math.round(oldAverageCost));
  }

  if (oldStock <= 0 || oldAverageCost <= 0) {
    return Math.max(0, Math.round(purchaseCostPerBaseUnit));
  }

  const totalOldValue = oldStock * oldAverageCost;
  const totalNewValue = purchasedBaseQty * purchaseCostPerBaseUnit;
  const totalStock = oldStock + purchasedBaseQty;

  if (totalStock <= 0) {
    return Math.max(0, Math.round(purchaseCostPerBaseUnit));
  }

  const newAverage = (totalOldValue + totalNewValue) / totalStock;
  return Math.max(0, Math.round(newAverage));
}
