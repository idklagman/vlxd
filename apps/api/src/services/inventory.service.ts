import {
  db,
  purchases,
  purchaseItems,
  inventoryTransactions,
  inventoryBalances,
  productCosts,
  inventoryAdjustments,
  inventoryAdjustmentItems,
  warehouseTransfers,
  warehouseTransferItems,
  productVariants,
  unitConversions,
  eq,
  and,
  isNull,
  or,
} from '@vlxd/db';
import {
  InventoryTransactionType,
  InventoryReferenceType,
  calculateMovingAverageCost,
  CreatePurchaseInput,
  CreateInventoryAdjustmentInput,
  CreateWarehouseTransferInput,
} from '@vlxd/shared';
import { BusinessRuleError, NotFoundError } from '../utils/errors.js';

/**
 * Convert quantity from inputUnit to baseUnit for a given productVariant.
 */
export async function convertToBaseQuantity(
  productVariantId: string,
  inputUnitId: string,
  inputQuantity: number
): Promise<{ baseQuantity: number; baseUnitId: string }> {
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, productVariantId),
  });

  if (!variant) {
    throw new NotFoundError('Biến thể sản phẩm');
  }

  const baseUnitId = variant.baseUnitId;

  // If already in base unit, 1:1
  if (inputUnitId === baseUnitId) {
    return { baseQuantity: inputQuantity, baseUnitId };
  }

  // Look for variant-scoped conversion first, then global conversion
  const conversion = await db.query.unitConversions.findFirst({
    where: (uc, { and, eq, or, isNull }) =>
      and(
        eq(uc.fromUnitId, inputUnitId),
        eq(uc.toUnitId, baseUnitId),
        or(eq(uc.productVariantId, productVariantId), isNull(uc.productVariantId))
      ),
  });

  if (conversion) {
    const rate = parseFloat(conversion.conversionRate);
    const baseQuantity = Number((inputQuantity * rate).toFixed(6));
    return { baseQuantity, baseUnitId };
  }

  // Check inverse conversion
  const inverseConversion = await db.query.unitConversions.findFirst({
    where: (uc, { and, eq, or, isNull }) =>
      and(
        eq(uc.fromUnitId, baseUnitId),
        eq(uc.toUnitId, inputUnitId),
        or(eq(uc.productVariantId, productVariantId), isNull(uc.productVariantId))
      ),
  });

  if (inverseConversion) {
    const invRate = parseFloat(inverseConversion.conversionRate);
    if (invRate > 0) {
      const baseQuantity = Number((inputQuantity / invRate).toFixed(6));
      return { baseQuantity, baseUnitId };
    }
  }

  throw new BusinessRuleError(
    `Chưa cấu hình quy đổi từ đơn vị đã chọn sang đơn vị cơ sở cho sản phẩm này.`
  );
}

/**
 * Record an append-only stock transaction and update the realtime balance.
 */
export async function recordStockTransaction(params: {
  warehouseId: string;
  productVariantId: string;
  transactionType: string;
  referenceType: string;
  referenceId?: string;
  originalQuantity: number;
  originalUnitId: string;
  baseQuantity: number; // Positive for IN, Negative for OUT
  baseUnitId: string;
  costPerBaseUnit?: number;
  totalCost?: number;
  notes?: string;
}) {
  // 1. Insert into append-only ledger
  const [transaction] = await db
    .insert(inventoryTransactions)
    .values({
      warehouseId: params.warehouseId,
      productVariantId: params.productVariantId,
      transactionType: params.transactionType,
      referenceType: params.referenceType,
      referenceId: params.referenceId || null,
      originalQuantity: String(params.originalQuantity),
      originalUnitId: params.originalUnitId,
      baseQuantity: String(params.baseQuantity),
      baseUnitId: params.baseUnitId,
      costPerBaseUnit: params.costPerBaseUnit !== undefined ? params.costPerBaseUnit : null,
      totalCost: params.totalCost !== undefined ? params.totalCost : null,
      notes: params.notes || null,
    })
    .returning();

  // 2. Update / Upsert inventory balance
  const existingBalance = await db.query.inventoryBalances.findFirst({
    where: and(
      eq(inventoryBalances.warehouseId, params.warehouseId),
      eq(inventoryBalances.productVariantId, params.productVariantId)
    ),
  });

  if (existingBalance) {
    const currentStockNum = parseFloat(existingBalance.currentStock);
    const newStock = Number((currentStockNum + params.baseQuantity).toFixed(6));

    await db
      .update(inventoryBalances)
      .set({
        currentStock: String(newStock),
        updatedAt: new Date(),
      })
      .where(eq(inventoryBalances.id, existingBalance.id));
  } else {
    await db.insert(inventoryBalances).values({
      warehouseId: params.warehouseId,
      productVariantId: params.productVariantId,
      currentStock: String(params.baseQuantity),
      reservedStock: '0',
      baseUnitId: params.baseUnitId,
    });
  }

  return transaction;
}

/**
 * Execute Stock-in for a Purchase Order (Transition DRAFT -> RECEIVED)
 */
export async function receivePurchaseOrder(purchaseId: string) {
  const purchase = await db.query.purchases.findFirst({
    where: eq(purchases.id, purchaseId),
    with: {
      items: true,
    },
  });

  if (!purchase) {
    throw new NotFoundError('Đơn nhập hàng');
  }

  if (purchase.status !== 'DRAFT') {
    throw new BusinessRuleError(
      `Đơn nhập hàng đang ở trạng thái "${purchase.status}", không thể xác nhận nhập kho.`
    );
  }

  // Process stock-in for each item
  for (const item of purchase.items) {
    const baseQty = parseFloat(item.baseQuantity);
    const costPerBaseUnit = item.costPerBaseUnit;
    const totalCost = item.totalAmount;

    // 1. Record stock ledger transaction
    await recordStockTransaction({
      warehouseId: purchase.warehouseId,
      productVariantId: item.productVariantId,
      transactionType: InventoryTransactionType.PURCHASE_IN,
      referenceType: InventoryReferenceType.PURCHASE,
      referenceId: purchase.id,
      originalQuantity: parseFloat(item.inputQuantity),
      originalUnitId: item.inputUnitId,
      baseQuantity: baseQty,
      baseUnitId: item.baseUnitId,
      costPerBaseUnit,
      totalCost,
      notes: `Nhập hàng từ đơn ${purchase.code}`,
    });

    // 2. Update Moving Average Cost in product_costs
    const existingCost = await db.query.productCosts.findFirst({
      where: eq(productCosts.productVariantId, item.productVariantId),
    });

    // Get total current stock across all warehouses for this variant
    const allBalances = await db.query.inventoryBalances.findMany({
      where: eq(inventoryBalances.productVariantId, item.productVariantId),
    });
    const totalCurrentStock = allBalances.reduce(
      (sum, b) => sum + parseFloat(b.currentStock),
      0
    );
    const oldStock = Math.max(0, totalCurrentStock - baseQty); // stock before this receipt

    const oldAverageCost = existingCost ? existingCost.averageCost : 0;
    const newAverageCost = calculateMovingAverageCost({
      oldStock,
      oldAverageCost,
      purchasedBaseQty: baseQty,
      purchaseCostPerBaseUnit: costPerBaseUnit,
    });

    if (existingCost) {
      await db
        .update(productCosts)
        .set({
          averageCost: newAverageCost,
          lastPurchasePrice: costPerBaseUnit,
          updatedAt: new Date(),
        })
        .where(eq(productCosts.id, existingCost.id));
    } else {
      await db.insert(productCosts).values({
        productVariantId: item.productVariantId,
        averageCost: newAverageCost,
        lastPurchasePrice: costPerBaseUnit,
        baseUnitId: item.baseUnitId,
      });
    }
  }

  // 3. Mark purchase as RECEIVED
  const [updatedPurchase] = await db
    .update(purchases)
    .set({
      status: 'RECEIVED',
      receivedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(purchases.id, purchaseId))
    .returning();

  return updatedPurchase;
}

/**
 * Execute Stock Count Adjustment with mandatory reason.
 */
export async function executeInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
  createdById?: string
) {
  const code = `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [adjustment] = await db
    .insert(inventoryAdjustments)
    .values({
      code,
      warehouseId: input.warehouseId,
      adjustmentDate: input.adjustmentDate,
      reason: input.reason,
      createdById: createdById || null,
    })
    .returning();

  for (const item of input.items) {
    const existingBalance = await db.query.inventoryBalances.findFirst({
      where: and(
        eq(inventoryBalances.warehouseId, input.warehouseId),
        eq(inventoryBalances.productVariantId, item.productVariantId)
      ),
    });

    const oldQty = existingBalance ? parseFloat(existingBalance.currentStock) : 0;
    const newQty = item.newQuantity;
    const diffQty = Number((newQty - oldQty).toFixed(6));

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.productVariantId),
    });

    if (!variant) continue;

    // Record adjustment item
    await db.insert(inventoryAdjustmentItems).values({
      adjustmentId: adjustment.id,
      productVariantId: item.productVariantId,
      oldQuantity: String(oldQty),
      newQuantity: String(newQty),
      adjustedQuantity: String(diffQty),
      baseUnitId: variant.baseUnitId,
      notes: item.notes || null,
    });

    // Record ledger transaction and update balance
    await recordStockTransaction({
      warehouseId: input.warehouseId,
      productVariantId: item.productVariantId,
      transactionType: InventoryTransactionType.MANUAL_ADJUSTMENT,
      referenceType: InventoryReferenceType.ADJUSTMENT,
      referenceId: adjustment.id,
      originalQuantity: Math.abs(diffQty),
      originalUnitId: variant.baseUnitId,
      baseQuantity: diffQty,
      baseUnitId: variant.baseUnitId,
      notes: `Điều chỉnh kiểm kê (${adjustment.code}): ${input.reason}`,
    });
  }

  return adjustment;
}

/**
 * Execute Warehouse Transfer between two warehouses.
 */
export async function executeWarehouseTransfer(
  input: CreateWarehouseTransferInput,
  createdById?: string
) {
  const code = `CK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [transfer] = await db
    .insert(warehouseTransfers)
    .values({
      code,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      transferDate: input.transferDate,
      notes: input.notes || null,
      createdById: createdById || null,
    })
    .returning();

  for (const item of input.items) {
    const { baseQuantity, baseUnitId } = await convertToBaseQuantity(
      item.productVariantId,
      item.unitId,
      item.quantity
    );

    // Save transfer item
    await db.insert(warehouseTransferItems).values({
      transferId: transfer.id,
      productVariantId: item.productVariantId,
      quantity: String(item.quantity),
      unitId: item.unitId,
      baseQuantity: String(baseQuantity),
      baseUnitId,
    });

    // 1. Record TRANSFER_OUT from source warehouse (negative baseQuantity)
    await recordStockTransaction({
      warehouseId: input.fromWarehouseId,
      productVariantId: item.productVariantId,
      transactionType: InventoryTransactionType.TRANSFER_OUT,
      referenceType: InventoryReferenceType.TRANSFER,
      referenceId: transfer.id,
      originalQuantity: item.quantity,
      originalUnitId: item.unitId,
      baseQuantity: -baseQuantity,
      baseUnitId,
      notes: `Chuyển kho (${transfer.code}) sang kho nhận`,
    });

    // 2. Record TRANSFER_IN to destination warehouse (positive baseQuantity)
    await recordStockTransaction({
      warehouseId: input.toWarehouseId,
      productVariantId: item.productVariantId,
      transactionType: InventoryTransactionType.TRANSFER_IN,
      referenceType: InventoryReferenceType.TRANSFER,
      referenceId: transfer.id,
      originalQuantity: item.quantity,
      originalUnitId: item.unitId,
      baseQuantity: baseQuantity,
      baseUnitId,
      notes: `Nhận điều chuyển (${transfer.code}) từ kho xuất`,
    });
  }

  return transfer;
}
