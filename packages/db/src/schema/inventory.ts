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
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { warehouses, suppliers, productVariants, units } from './master-data';

// 1. Purchases (Đơn nhập hàng)
export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // NH-20260823-0001
    supplierId: uuid('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    purchaseDate: date('purchase_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('DRAFT'), // DRAFT, RECEIVED, CANCELLED
    subtotalAmount: bigint('subtotal_amount', { mode: 'number' }).notNull().default(0),
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    grandTotal: bigint('grand_total', { mode: 'number' }).notNull().default(0),
    paidAmount: bigint('paid_amount', { mode: 'number' }).notNull().default(0),
    debtAmount: bigint('debt_amount', { mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_purchases_supplier').on(table.supplierId),
    index('idx_purchases_warehouse').on(table.warehouseId),
    index('idx_purchases_date').on(table.purchaseDate),
    index('idx_purchases_status').on(table.status),
  ]
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

// 2. Purchase Items (Chi tiết đơn nhập hàng)
export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseId: uuid('purchase_id')
      .references(() => purchases.id, { onDelete: 'cascade' })
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
    unitPrice: bigint('unit_price', { mode: 'number' }).notNull(), // Đơn giá theo inputUnit
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
    costPerBaseUnit: bigint('cost_per_base_unit', { mode: 'number' }).notNull(), // Đơn giá quy về baseUnit
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_purchase_items_purchase').on(table.purchaseId),
    index('idx_purchase_items_variant').on(table.productVariantId),
  ]
);

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;

// 3. Inventory Transactions (Sổ cái Tồn kho bất biến — Append-only)
export const inventoryTransactions = pgTable(
  'inventory_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // PURCHASE_IN, SALE_OUT, TRANSFER_IN, TRANSFER_OUT, MANUAL_ADJUSTMENT, REVERSAL
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // PURCHASE, SALES_ORDER, ADJUSTMENT, TRANSFER
    referenceId: uuid('reference_id'),
    originalQuantity: numeric('original_quantity', { precision: 18, scale: 6 }).notNull(),
    originalUnitId: uuid('original_unit_id')
      .references(() => units.id)
      .notNull(),
    baseQuantity: numeric('base_quantity', { precision: 18, scale: 6 }).notNull(), // Dương = Nhập, Âm = Xuất
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
    costPerBaseUnit: bigint('cost_per_base_unit', { mode: 'number' }),
    totalCost: bigint('total_cost', { mode: 'number' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_inv_trans_warehouse').on(table.warehouseId),
    index('idx_inv_trans_variant').on(table.productVariantId),
    index('idx_inv_trans_type').on(table.transactionType),
    index('idx_inv_trans_created').on(table.createdAt),
    index('idx_inv_trans_ref').on(table.referenceType, table.referenceId),
  ]
);

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// 4. Inventory Balances (Bảng Tồn kho tức thời)
export const inventoryBalances = pgTable(
  'inventory_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    currentStock: numeric('current_stock', { precision: 18, scale: 6 }).notNull().default('0'),
    reservedStock: numeric('reserved_stock', { precision: 18, scale: 6 }).notNull().default('0'),
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_inv_balances_wh_variant').on(table.warehouseId, table.productVariantId),
    index('idx_inv_balances_variant').on(table.productVariantId),
  ]
);

export type InventoryBalance = typeof inventoryBalances.$inferSelect;
export type NewInventoryBalance = typeof inventoryBalances.$inferInsert;

// 5. Product Costs (Giá vốn bình quân di động)
export const productCosts = pgTable(
  'product_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull()
      .unique(),
    averageCost: bigint('average_cost', { mode: 'number' }).notNull().default(0), // VND per baseUnit
    lastPurchasePrice: bigint('last_purchase_price', { mode: 'number' }).notNull().default(0),
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export type ProductCost = typeof productCosts.$inferSelect;
export type NewProductCost = typeof productCosts.$inferInsert;

// 6. Inventory Adjustments (Phiếu kiểm kê & điều chỉnh kho)
export const inventoryAdjustments = pgTable(
  'inventory_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // DC-20260823-0001
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    adjustmentDate: date('adjustment_date').notNull(),
    reason: text('reason').notNull(), // BẮT BUỘC NHẬP LÝ DO
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_inv_adj_warehouse').on(table.warehouseId),
    index('idx_inv_adj_date').on(table.adjustmentDate),
  ]
);

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;

// 7. Inventory Adjustment Items (Chi tiết điều chỉnh kho)
export const inventoryAdjustmentItems = pgTable(
  'inventory_adjustment_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adjustmentId: uuid('adjustment_id')
      .references(() => inventoryAdjustments.id, { onDelete: 'cascade' })
      .notNull(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    oldQuantity: numeric('old_quantity', { precision: 18, scale: 6 }).notNull(),
    newQuantity: numeric('new_quantity', { precision: 18, scale: 6 }).notNull(),
    adjustedQuantity: numeric('adjusted_quantity', { precision: 18, scale: 6 }).notNull(), // new - old
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
    notes: text('notes'),
  },
  (table) => [
    index('idx_inv_adj_items_adj').on(table.adjustmentId),
    index('idx_inv_adj_items_variant').on(table.productVariantId),
  ]
);

export type InventoryAdjustmentItem = typeof inventoryAdjustmentItems.$inferSelect;
export type NewInventoryAdjustmentItem = typeof inventoryAdjustmentItems.$inferInsert;

// 8. Warehouse Transfers (Phiếu chuyển kho nội bộ)
export const warehouseTransfers = pgTable(
  'warehouse_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // CK-20260823-0001
    fromWarehouseId: uuid('from_warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    toWarehouseId: uuid('to_warehouse_id')
      .references(() => warehouses.id)
      .notNull(),
    transferDate: date('transfer_date').notNull(),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_wh_transfers_from').on(table.fromWarehouseId),
    index('idx_wh_transfers_to').on(table.toWarehouseId),
    index('idx_wh_transfers_date').on(table.transferDate),
  ]
);

export type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
export type NewWarehouseTransfer = typeof warehouseTransfers.$inferInsert;

// 9. Warehouse Transfer Items (Chi tiết chuyển kho)
export const warehouseTransferItems = pgTable(
  'warehouse_transfer_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transferId: uuid('transfer_id')
      .references(() => warehouseTransfers.id, { onDelete: 'cascade' })
      .notNull(),
    productVariantId: uuid('product_variant_id')
      .references(() => productVariants.id)
      .notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
    unitId: uuid('unit_id')
      .references(() => units.id)
      .notNull(),
    baseQuantity: numeric('base_quantity', { precision: 18, scale: 6 }).notNull(),
    baseUnitId: uuid('base_unit_id')
      .references(() => units.id)
      .notNull(),
  },
  (table) => [
    index('idx_wh_trans_items_transfer').on(table.transferId),
    index('idx_wh_trans_items_variant').on(table.productVariantId),
  ]
);

export type WarehouseTransferItem = typeof warehouseTransferItems.$inferSelect;
export type NewWarehouseTransferItem = typeof warehouseTransferItems.$inferInsert;

// === Relations ===

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  warehouse: one(warehouses, {
    fields: [purchases.warehouseId],
    references: [warehouses.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  productVariant: one(productVariants, {
    fields: [purchaseItems.productVariantId],
    references: [productVariants.id],
  }),
  inputUnit: one(units, {
    fields: [purchaseItems.inputUnitId],
    references: [units.id],
  }),
  baseUnit: one(units, {
    fields: [purchaseItems.baseUnitId],
    references: [units.id],
  }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [inventoryTransactions.warehouseId],
    references: [warehouses.id],
  }),
  productVariant: one(productVariants, {
    fields: [inventoryTransactions.productVariantId],
    references: [productVariants.id],
  }),
  originalUnit: one(units, {
    fields: [inventoryTransactions.originalUnitId],
    references: [units.id],
  }),
  baseUnit: one(units, {
    fields: [inventoryTransactions.baseUnitId],
    references: [units.id],
  }),
}));

export const inventoryBalancesRelations = relations(inventoryBalances, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [inventoryBalances.warehouseId],
    references: [warehouses.id],
  }),
  productVariant: one(productVariants, {
    fields: [inventoryBalances.productVariantId],
    references: [productVariants.id],
  }),
  baseUnit: one(units, {
    fields: [inventoryBalances.baseUnitId],
    references: [units.id],
  }),
}));

export const productCostsRelations = relations(productCosts, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [productCosts.productVariantId],
    references: [productVariants.id],
  }),
  baseUnit: one(units, {
    fields: [productCosts.baseUnitId],
    references: [units.id],
  }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [inventoryAdjustments.warehouseId],
    references: [warehouses.id],
  }),
  createdBy: one(users, {
    fields: [inventoryAdjustments.createdById],
    references: [users.id],
  }),
  items: many(inventoryAdjustmentItems),
}));

export const inventoryAdjustmentItemsRelations = relations(inventoryAdjustmentItems, ({ one }) => ({
  adjustment: one(inventoryAdjustments, {
    fields: [inventoryAdjustmentItems.adjustmentId],
    references: [inventoryAdjustments.id],
  }),
  productVariant: one(productVariants, {
    fields: [inventoryAdjustmentItems.productVariantId],
    references: [productVariants.id],
  }),
  baseUnit: one(units, {
    fields: [inventoryAdjustmentItems.baseUnitId],
    references: [units.id],
  }),
}));

export const warehouseTransfersRelations = relations(warehouseTransfers, ({ one, many }) => ({
  fromWarehouse: one(warehouses, {
    fields: [warehouseTransfers.fromWarehouseId],
    references: [warehouses.id],
  }),
  toWarehouse: one(warehouses, {
    fields: [warehouseTransfers.toWarehouseId],
    references: [warehouses.id],
  }),
  createdBy: one(users, {
    fields: [warehouseTransfers.createdById],
    references: [users.id],
  }),
  items: many(warehouseTransferItems),
}));

export const warehouseTransferItemsRelations = relations(warehouseTransferItems, ({ one }) => ({
  transfer: one(warehouseTransfers, {
    fields: [warehouseTransferItems.transferId],
    references: [warehouseTransfers.id],
  }),
  productVariant: one(productVariants, {
    fields: [warehouseTransferItems.productVariantId],
    references: [productVariants.id],
  }),
  unit: one(units, {
    fields: [warehouseTransferItems.unitId],
    references: [units.id],
  }),
  baseUnit: one(units, {
    fields: [warehouseTransferItems.baseUnitId],
    references: [units.id],
  }),
}));
