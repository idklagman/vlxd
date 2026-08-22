import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  numeric,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { vehicles, drivers, productVariants, units } from './master-data';
import { salesOrders, salesOrderItems } from './sales';

// 1. Deliveries (Chuyến xe giao hàng / Phiếu điều xe)
export const deliveries = pgTable(
  'deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // CX-20260823-0001
    salesOrderId: uuid('sales_order_id')
      .references(() => salesOrders.id)
      .notNull(),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    driverId: uuid('driver_id').references(() => drivers.id),
    deliveryDate: date('delivery_date').notNull(),
    deliveryAddress: text('delivery_address'),
    deliveryContactName: varchar('delivery_contact_name', { length: 255 }),
    deliveryContactPhone: varchar('delivery_contact_phone', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, IN_TRANSIT, DELIVERED, CANCELLED
    shippingFee: bigint('shipping_fee', { mode: 'number' }).notNull().default(0), // Cước xe thu khách
    driverCost: bigint('driver_cost', { mode: 'number' }).notNull().default(0), // Chi phí bồi dưỡng lái xe
    notes: text('notes'),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_deliveries_order').on(table.salesOrderId),
    index('idx_deliveries_vehicle').on(table.vehicleId),
    index('idx_deliveries_driver').on(table.driverId),
    index('idx_deliveries_status').on(table.status),
    index('idx_deliveries_date').on(table.deliveryDate),
  ]
);

export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;

// 2. Delivery Items (Chi tiết vật tư bốc lên chuyến xe)
export const deliveryItems = pgTable(
  'delivery_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deliveryId: uuid('delivery_id')
      .references(() => deliveries.id, { onDelete: 'cascade' })
      .notNull(),
    salesOrderItemId: uuid('sales_order_item_id').references(() => salesOrderItems.id),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
    unitId: uuid('unit_id')
      .references(() => units.id)
      .notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_del_items_delivery').on(table.deliveryId),
    index('idx_del_items_variant').on(table.productVariantId),
  ]
);

export type DeliveryItem = typeof deliveryItems.$inferSelect;
export type NewDeliveryItem = typeof deliveryItems.$inferInsert;

// === Relations ===

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  salesOrder: one(salesOrders, {
    fields: [deliveries.salesOrderId],
    references: [salesOrders.id],
  }),
  vehicle: one(vehicles, {
    fields: [deliveries.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [deliveries.driverId],
    references: [drivers.id],
  }),
  createdBy: one(users, {
    fields: [deliveries.createdById],
    references: [users.id],
  }),
  items: many(deliveryItems),
}));

export const deliveryItemsRelations = relations(deliveryItems, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryItems.deliveryId],
    references: [deliveries.id],
  }),
  salesOrderItem: one(salesOrderItems, {
    fields: [deliveryItems.salesOrderItemId],
    references: [salesOrderItems.id],
  }),
  productVariant: one(productVariants, {
    fields: [deliveryItems.productVariantId],
    references: [productVariants.id],
  }),
  unit: one(units, {
    fields: [deliveryItems.unitId],
    references: [units.id],
  }),
}));
