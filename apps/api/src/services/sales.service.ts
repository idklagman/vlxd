import {
  db,
  salesOrders,
  salesOrderItems,
  inventoryBalances,
  productCosts,
  productVariants,
  eq,
  and,
  desc,
} from '@vlxd/db';
import {
  OrderStatus,
  InventoryTransactionType,
  InventoryReferenceType,
  CreateSalesOrderInput,
} from '@vlxd/shared';
import { convertToBaseQuantity, recordStockTransaction } from './inventory.service.js';
import { BusinessRuleError, NotFoundError } from '../utils/errors.js';

/**
 * Create a new Sales Order (DRAFT) with price and cost snapshots.
 */
export async function createSalesOrder(input: CreateSalesOrderInput, createdById?: string) {
  const code = `DH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  let subtotal = 0;
  const processedItems: Array<{
    productVariantId: string;
    inputQuantity: number;
    inputUnitId: string;
    baseQuantity: number;
    baseUnitId: string;
    unitPrice: number;
    discountAmount: number;
    totalAmount: number;
    costPerBaseUnit: number;
    notes?: string | null;
  }> = [];

  for (const item of input.items) {
    const { baseQuantity, baseUnitId } = await convertToBaseQuantity(
      item.productVariantId,
      item.inputUnitId,
      item.inputQuantity
    );

    // 1. Stock availability validation
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.productVariantId),
      with: { product: true, baseUnit: true },
    });

    if (variant && variant.sku !== 'CONG-BE-DAI') {
      const balance = await db.query.inventoryBalances.findFirst({
        where: and(
          eq(inventoryBalances.warehouseId, input.warehouseId),
          eq(inventoryBalances.productVariantId, item.productVariantId)
        ),
      });

      const currentStock = balance ? parseFloat(balance.currentStock) : 0;
      const reservedStock = balance ? parseFloat(balance.reservedStock) : 0;
      const availableStock = Math.max(0, currentStock - reservedStock);

      if (baseQuantity > availableStock) {
        const unitName = variant.baseUnit?.code || 'đơn vị';
        throw new BusinessRuleError(
          `Mặt hàng "${variant.name}" không đủ tồn kho để bán (Tồn khả dụng: ${availableStock} ${unitName}, yêu cầu: ${baseQuantity} ${unitName}). Vui lòng nhập hàng vào kho trước khi tạo đơn.`
        );
      }
    }

    const lineTotal = Math.max(
      0,
      Math.round(item.inputQuantity * item.unitPrice) - (item.discountAmount || 0)
    );
    subtotal += lineTotal;

    // Snapshot current moving average cost
    const costRecord = await db.query.productCosts.findFirst({
      where: eq(productCosts.productVariantId, item.productVariantId),
    });
    const costPerBaseUnit = costRecord ? costRecord.averageCost : 0;

    processedItems.push({
      productVariantId: item.productVariantId,
      inputQuantity: item.inputQuantity,
      inputUnitId: item.inputUnitId,
      baseQuantity,
      baseUnitId,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount || 0,
      totalAmount: lineTotal,
      costPerBaseUnit,
      notes: item.notes || null,
    });
  }

  const discountAmount = input.discountAmount || 0;
  const shippingFee = input.shippingFee || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const paidAmount = input.paidAmount || 0;
  const debtAmount = Math.max(0, grandTotal - paidAmount);

  const [order] = await db
    .insert(salesOrders)
    .values({
      code,
      customerId: input.customerId,
      projectId: input.projectId || null,
      warehouseId: input.warehouseId,
      orderDate: input.orderDate,
      deliveryAddress: input.deliveryAddress || null,
      deliveryContactName: input.deliveryContactName || null,
      deliveryContactPhone: input.deliveryContactPhone || null,
      status: OrderStatus.DRAFT,
      subtotalAmount: subtotal,
      discountAmount,
      shippingFee,
      grandTotal,
      paidAmount,
      debtAmount,
      notes: input.notes || null,
      createdById: createdById || null,
    })
    .returning();

  for (const it of processedItems) {
    await db.insert(salesOrderItems).values({
      salesOrderId: order.id,
      productVariantId: it.productVariantId,
      inputQuantity: String(it.inputQuantity),
      inputUnitId: it.inputUnitId,
      baseQuantity: String(it.baseQuantity),
      baseUnitId: it.baseUnitId,
      unitPrice: it.unitPrice,
      discountAmount: it.discountAmount,
      totalAmount: it.totalAmount,
      costPerBaseUnit: it.costPerBaseUnit,
      notes: it.notes,
    });
  }

  return order;
}

/**
 * Confirm a sales order and reserve stock (DRAFT -> CONFIRMED).
 */
export async function confirmSalesOrder(orderId: string) {
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, orderId),
    with: { items: true },
  });

  if (!order) {
    throw new NotFoundError('Đơn bán hàng');
  }

  if (order.status !== OrderStatus.DRAFT) {
    throw new BusinessRuleError(
      `Đơn hàng đang ở trạng thái "${order.status}", không thể xác nhận.`
    );
  }

  // Check and reserve stock for each item
  for (const item of order.items) {
    const baseQty = parseFloat(item.baseQuantity);
    const balance = await db.query.inventoryBalances.findFirst({
      where: and(
        eq(inventoryBalances.warehouseId, order.warehouseId),
        eq(inventoryBalances.productVariantId, item.productVariantId)
      ),
    });

    const currentReserved = balance ? parseFloat(balance.reservedStock) : 0;
    const newReserved = Number((currentReserved + baseQty).toFixed(6));

    if (balance) {
      await db
        .update(inventoryBalances)
        .set({
          reservedStock: String(newReserved),
          updatedAt: new Date(),
        })
        .where(eq(inventoryBalances.id, balance.id));
    } else {
      await db.insert(inventoryBalances).values({
        warehouseId: order.warehouseId,
        productVariantId: item.productVariantId,
        currentStock: '0',
        reservedStock: String(baseQty),
        baseUnitId: item.baseUnitId,
      });
    }
  }

  const [updated] = await db
    .update(salesOrders)
    .set({
      status: OrderStatus.CONFIRMED,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salesOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Dispatch sales order (Release reservation + deduct current stock + record SALE_OUT ledger).
 */
export async function dispatchSalesOrder(orderId: string) {
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, orderId),
    with: { items: true },
  });

  if (!order) {
    throw new NotFoundError('Đơn bán hàng');
  }

  if (
    order.status !== OrderStatus.CONFIRMED &&
    order.status !== OrderStatus.PREPARING &&
    order.status !== OrderStatus.DRAFT
  ) {
    throw new BusinessRuleError(
      `Đơn hàng đang ở trạng thái "${order.status}", không thể xuất kho giao hàng.`
    );
  }

  const wasReserved =
    order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING;

  for (const item of order.items) {
    const baseQty = parseFloat(item.baseQuantity);

    // If stock was previously reserved, release reserved stock
    if (wasReserved) {
      const balance = await db.query.inventoryBalances.findFirst({
        where: and(
          eq(inventoryBalances.warehouseId, order.warehouseId),
          eq(inventoryBalances.productVariantId, item.productVariantId)
        ),
      });

      if (balance) {
        const currentReserved = parseFloat(balance.reservedStock);
        const newReserved = Math.max(0, Number((currentReserved - baseQty).toFixed(6)));
        await db
          .update(inventoryBalances)
          .set({
            reservedStock: String(newReserved),
            updatedAt: new Date(),
          })
          .where(eq(inventoryBalances.id, balance.id));
      }
    }

    // Deduct current stock and record SALE_OUT ledger transaction
    await recordStockTransaction({
      warehouseId: order.warehouseId,
      productVariantId: item.productVariantId,
      transactionType: InventoryTransactionType.SALE_OUT,
      referenceType: InventoryReferenceType.SALES_ORDER,
      referenceId: order.id,
      originalQuantity: parseFloat(item.inputQuantity),
      originalUnitId: item.inputUnitId,
      baseQuantity: -baseQty, // Negative for stock-out
      baseUnitId: item.baseUnitId,
      costPerBaseUnit: item.costPerBaseUnit,
      totalCost: Math.round(baseQty * item.costPerBaseUnit),
      notes: `Xuất kho bán hàng theo đơn ${order.code}`,
    });
  }

  const [updated] = await db
    .update(salesOrders)
    .set({
      status: OrderStatus.DELIVERING,
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salesOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Mark order as COMPLETED.
 */
export async function completeSalesOrder(orderId: string) {
  const [updated] = await db
    .update(salesOrders)
    .set({
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salesOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Cancel a sales order and release reserved stock.
 */
export async function cancelSalesOrder(orderId: string) {
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, orderId),
    with: { items: true },
  });

  if (!order) {
    throw new NotFoundError('Đơn bán hàng');
  }

  if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
    throw new BusinessRuleError(`Không thể hủy đơn hàng đã ở trạng thái "${order.status}".`);
  }

  // If order had reserved stock, release it
  if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING) {
    for (const item of order.items) {
      const baseQty = parseFloat(item.baseQuantity);
      const balance = await db.query.inventoryBalances.findFirst({
        where: and(
          eq(inventoryBalances.warehouseId, order.warehouseId),
          eq(inventoryBalances.productVariantId, item.productVariantId)
        ),
      });

      if (balance) {
        const currentReserved = parseFloat(balance.reservedStock);
        const newReserved = Math.max(0, Number((currentReserved - baseQty).toFixed(6)));
        await db
          .update(inventoryBalances)
          .set({
            reservedStock: String(newReserved),
            updatedAt: new Date(),
          })
          .where(eq(inventoryBalances.id, balance.id));
      }
    }
  }

  // If order was already DELIVERING / DELIVERED, reverse stock-out
  if (order.status === OrderStatus.DELIVERING || order.status === OrderStatus.DELIVERED) {
    for (const item of order.items) {
      const baseQty = parseFloat(item.baseQuantity);
      await recordStockTransaction({
        warehouseId: order.warehouseId,
        productVariantId: item.productVariantId,
        transactionType: InventoryTransactionType.REVERSAL,
        referenceType: InventoryReferenceType.SALES_ORDER,
        referenceId: order.id,
        originalQuantity: parseFloat(item.inputQuantity),
        originalUnitId: item.inputUnitId,
        baseQuantity: baseQty, // Positive to restore stock
        baseUnitId: item.baseUnitId,
        costPerBaseUnit: item.costPerBaseUnit,
        totalCost: Math.round(baseQty * item.costPerBaseUnit),
        notes: `Hoàn kho do hủy đơn hàng ${order.code}`,
      });
    }
  }

  const [updated] = await db
    .update(salesOrders)
    .set({
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salesOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Get last sold price for customer and product variant.
 */
export async function getLastSoldPrice(customerId: string, productVariantId: string) {
  const lastItem = await db.query.salesOrderItems.findFirst({
    where: eq(salesOrderItems.productVariantId, productVariantId),
    with: {
      salesOrder: true,
      inputUnit: true,
    },
    orderBy: [desc(salesOrderItems.createdAt)],
  });

  if (!lastItem || lastItem.salesOrder.customerId !== customerId) {
    return null;
  }

  return {
    unitPrice: lastItem.unitPrice,
    inputUnitId: lastItem.inputUnitId,
    unitCode: lastItem.inputUnit.code,
    orderDate: lastItem.salesOrder.orderDate,
    orderCode: lastItem.salesOrder.code,
  };
}
