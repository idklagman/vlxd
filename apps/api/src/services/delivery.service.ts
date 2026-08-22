import {
  db,
  deliveries,
  deliveryItems,
  salesOrders,
  eq,
} from '@vlxd/db';
import { CreateDeliveryInput, OrderStatus } from '@vlxd/shared';
import { BusinessRuleError, NotFoundError } from '../utils/errors.js';

/**
 * Create a new Delivery Trip (CX-XXXX) linked to a Sales Order.
 */
export async function createDeliveryTrip(input: CreateDeliveryInput, createdById?: string) {
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, input.salesOrderId),
  });

  if (!order) {
    throw new NotFoundError('Đơn bán hàng');
  }

  const code = `CX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [delivery] = await db
    .insert(deliveries)
    .values({
      code,
      salesOrderId: input.salesOrderId,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      deliveryDate: input.deliveryDate,
      deliveryAddress: input.deliveryAddress || order.deliveryAddress || null,
      deliveryContactName: input.deliveryContactName || order.deliveryContactName || null,
      deliveryContactPhone: input.deliveryContactPhone || order.deliveryContactPhone || null,
      status: 'PENDING',
      shippingFee: input.shippingFee || 0,
      driverCost: input.driverCost || 0,
      notes: input.notes || null,
      createdById: createdById || null,
    })
    .returning();

  for (const item of input.items) {
    await db.insert(deliveryItems).values({
      deliveryId: delivery.id,
      salesOrderItemId: item.salesOrderItemId || null,
      productVariantId: item.productVariantId,
      quantity: String(item.quantity),
      unitId: item.unitId,
      notes: item.notes || null,
    });
  }

  return delivery;
}

/**
 * Dispatch delivery trip (PENDING -> IN_TRANSIT).
 */
export async function dispatchDeliveryTrip(deliveryId: string) {
  const delivery = await db.query.deliveries.findFirst({
    where: eq(deliveries.id, deliveryId),
  });

  if (!delivery) {
    throw new NotFoundError('Chuyến xe giao hàng');
  }

  if (delivery.status !== 'PENDING') {
    throw new BusinessRuleError(`Chuyến xe đang ở trạng thái "${delivery.status}", không thể xuất bến.`);
  }

  const [updated] = await db
    .update(deliveries)
    .set({
      status: 'IN_TRANSIT',
      dispatchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  // Update sales order status to DELIVERING if it was CONFIRMED or PREPARING
  const order = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, delivery.salesOrderId),
  });

  if (order && (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING)) {
    await db
      .update(salesOrders)
      .set({
        status: OrderStatus.DELIVERING,
        updatedAt: new Date(),
      })
      .where(eq(salesOrders.id, order.id));
  }

  return updated;
}

/**
 * Complete delivery trip (IN_TRANSIT -> DELIVERED).
 */
export async function completeDeliveryTrip(deliveryId: string) {
  const delivery = await db.query.deliveries.findFirst({
    where: eq(deliveries.id, deliveryId),
  });

  if (!delivery) {
    throw new NotFoundError('Chuyến xe giao hàng');
  }

  if (delivery.status !== 'IN_TRANSIT' && delivery.status !== 'PENDING') {
    throw new BusinessRuleError(`Chuyến xe đang ở trạng thái "${delivery.status}", không thể hoàn thành.`);
  }

  const [updated] = await db
    .update(deliveries)
    .set({
      status: 'DELIVERED',
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  // Update sales order status to DELIVERED
  await db
    .update(salesOrders)
    .set({
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(salesOrders.id, delivery.salesOrderId));

  return updated;
}

/**
 * Cancel delivery trip.
 */
export async function cancelDeliveryTrip(deliveryId: string) {
  const delivery = await db.query.deliveries.findFirst({
    where: eq(deliveries.id, deliveryId),
  });

  if (!delivery) {
    throw new NotFoundError('Chuyến xe giao hàng');
  }

  if (delivery.status === 'DELIVERED') {
    throw new BusinessRuleError('Không thể hủy chuyến xe đã giao hàng thành công.');
  }

  const [updated] = await db
    .update(deliveries)
    .set({
      status: 'CANCELLED',
      updatedAt: new Date(),
    })
    .where(eq(deliveries.id, deliveryId))
    .returning();

  return updated;
}
