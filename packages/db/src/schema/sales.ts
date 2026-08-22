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
import { customers, projects, warehouses, productVariants, units } from './master-data';

// 1. Sales Orders (Đơn bán hàng)
export const salesOrders = pgTable(
  'sales_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // DH-20260823-0001
    customerId: uuid('customer_id')
      .references(() => customers.id)
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    orderDate: date('order_date').notNull(),
    deliveryAddress: text('delivery_address'),
    deliveryContactName: varchar('delivery_contact_name', { length: 255 }),
    deliveryContactPhone: varchar('delivery_contact_phone', { length: 50 }),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, CONFIRMED, PREPARING, DELIVERING, DELIVERED, COMPLETED, CANCELLED
    subtotalAmount: bigint('subtotal_amount', { mode: 'number' }).notNull().default(0),
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    shippingFee: bigint('shipping_fee', { mode: 'number' }).notNull().default(0),
    grandTotal: bigint('grand_total', { mode: 'number' }).notNull().default(0),
    paidAmount: bigint('paid_amount', { mode: 'number' }).notNull().default(0),
    debtAmount: bigint('debt_amount', { mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sales_orders_customer').on(table.customerId),
    index('idx_sales_orders_project').on(table.projectId),
    index('idx_sales_orders_warehouse').on(table.warehouseId),
    index('idx_sales_orders_date').on(table.orderDate),
    index('idx_sales_orders_status').on(table.status),
  ]
);

export type SalesOrder = typeof salesOrders.$inferSelect;
export type NewSalesOrder = typeof salesOrders.$inferInsert;

// 2. Sales Order Items (Chi tiết mặt hàng bán)
export const salesOrderItems = pgTable(
  'sales_order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    salesOrderId: uuid('sales_order_id')
      .references(() => salesOrders.id, { onDelete: 'cascade' })
      .notNull(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    inputQuantity: numeric('input_quantity', { precision: 18, scale: 6 }).notNull(),
    inputUnitId: uuid('input_unit_id')
      .references(() => units.id)
      .notNull(),
    baseQuantity: numeric('base_quantity', { precision: 18, scale: 6 }).notNull(),
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(), // Snapshot đơn giá bán theo inputUnit
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull(), // inputQuantity * unitPrice - discountAmount
    costPerBaseUnit: bigint('cost_per_base_unit', { mode: 'number' }).notNull().default(0), // Snapshot giá vốn tại thời điểm bán
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_so_items_order').on(table.salesOrderId),
    index('idx_so_items_variant').on(table.productVariantId),
  ]
);

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type NewSalesOrderItem = typeof salesOrderItems.$inferInsert;

// === Relations ===

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [salesOrders.projectId],
    references: [projects.id],
  }),
  warehouse: one(warehouses, {
    fields: [salesOrders.warehouseId],
    references: [warehouses.id],
  }),
  createdBy: one(users, {
    fields: [salesOrders.createdById],
    references: [users.id],
  }),
  items: many(salesOrderItems),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  salesOrder: one(salesOrders, {
    fields: [salesOrderItems.salesOrderId],
    references: [salesOrders.id],
  }),
  productVariant: one(productVariants, {
    fields: [salesOrderItems.productVariantId],
    references: [productVariants.id],
  }),
  inputUnit: one(units, {
    fields: [salesOrderItems.inputUnitId],
    references: [units.id],
  }),
  baseUnit: one(units, {
    fields: [salesOrderItems.baseUnitId],
    references: [units.id],
  }),
}));
