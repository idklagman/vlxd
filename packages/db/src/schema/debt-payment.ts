import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { customers, projects, suppliers } from './master-data';
import { salesOrders } from './sales';
import { purchases } from './inventory';

// 1. Customer Debts (Sổ cái Công nợ Khách hàng — Append-only)
export const customerDebts = pgTable(
  'customer_debts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .references(() => customers.id)
      .notNull(),
    projectId: uuid('project_id').references(() => projects.id),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // SALE, PAYMENT, ADJUSTMENT, REFUND
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // SALES_ORDER, PAYMENT, MANUAL_ADJUSTMENT
    referenceId: uuid('reference_id'),
    amount: bigint('amount', { mode: 'number' }).notNull(), // Dương = Tăng nợ, Âm = Giảm nợ
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_cust_debt_customer').on(table.customerId),
    index('idx_cust_debt_project').on(table.projectId),
    index('idx_cust_debt_type').on(table.transactionType),
    index('idx_cust_debt_created').on(table.createdAt),
    index('idx_cust_debt_ref').on(table.referenceType, table.referenceId),
  ]
);

export type CustomerDebt = typeof customerDebts.$inferSelect;
export type NewCustomerDebt = typeof customerDebts.$inferInsert;

// 2. Supplier Debts (Sổ cái Công nợ Nhà cung cấp — Append-only)
export const supplierDebts = pgTable(
  'supplier_debts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplierId: uuid('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    transactionType: varchar('transaction_type', { length: 50 }).notNull(), // PURCHASE, PAYMENT, ADJUSTMENT, REFUND
    referenceType: varchar('reference_type', { length: 50 }).notNull(), // PURCHASE, PAYMENT, MANUAL_ADJUSTMENT
    referenceId: uuid('reference_id'),
    amount: bigint('amount', { mode: 'number' }).notNull(), // Dương = Tăng nợ NCC, Âm = Giảm nợ NCC
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_sup_debt_supplier').on(table.supplierId),
    index('idx_sup_debt_type').on(table.transactionType),
    index('idx_sup_debt_created').on(table.createdAt),
    index('idx_sup_debt_ref').on(table.referenceType, table.referenceId),
  ]
);

export type SupplierDebt = typeof supplierDebts.$inferSelect;
export type NewSupplierDebt = typeof supplierDebts.$inferInsert;

// 3. Payments (Phiếu Thu / Phiếu Chi)
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // PT-20260823-0001, PC-20260823-0001
    paymentType: varchar('payment_type', { length: 50 }).notNull(), // RECEIPT (Thu), PAYMENT (Chi)
    paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'), // CASH, BANK_TRANSFER
    customerId: uuid('customer_id').references(() => customers.id),
    projectId: uuid('project_id').references(() => projects.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    salesOrderId: uuid('sales_order_id').references(() => salesOrders.id),
    purchaseId: uuid('purchase_id').references(() => purchases.id),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    paymentDate: date('payment_date').notNull(),
    payerReceiverName: varchar('payer_receiver_name', { length: 255 }),
    notes: text('notes'),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_payments_type').on(table.paymentType),
    index('idx_payments_method').on(table.paymentMethod),
    index('idx_payments_customer').on(table.customerId),
    index('idx_payments_supplier').on(table.supplierId),
    index('idx_payments_date').on(table.paymentDate),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// 4. Cash Flow Entries (Sổ quỹ Thu - Chi Tiền mặt & Ngân hàng)
export const cashFlowEntries = pgTable(
  'cash_flow_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .references(() => payments.id, { onDelete: 'cascade' })
      .notNull(),
    accountType: varchar('account_type', { length: 50 }).notNull(), // CASH, BANK
    direction: varchar('direction', { length: 50 }).notNull(), // IN (Thu vào), OUT (Chi ra)
    amount: bigint('amount', { mode: 'number' }).notNull(),
    balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
    transactionDate: date('transaction_date').notNull(),
    category: varchar('category', { length: 100 }).notNull(), // THU_TIEN_HANG, TRA_TIEN_NCC, THU_KHAC, CHI_KHAC
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_cash_flow_account').on(table.accountType),
    index('idx_cash_flow_direction').on(table.direction),
    index('idx_cash_flow_date').on(table.transactionDate),
  ]
);

export type CashFlowEntry = typeof cashFlowEntries.$inferSelect;
export type NewCashFlowEntry = typeof cashFlowEntries.$inferInsert;

// === Relations ===

export const customerDebtsRelations = relations(customerDebts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerDebts.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [customerDebts.projectId],
    references: [projects.id],
  }),
}));

export const supplierDebtsRelations = relations(supplierDebts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierDebts.supplierId],
    references: [suppliers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  supplier: one(suppliers, {
    fields: [payments.supplierId],
    references: [suppliers.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [payments.salesOrderId],
    references: [salesOrders.id],
  }),
  purchase: one(purchases, {
    fields: [payments.purchaseId],
    references: [purchases.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
  cashFlowEntries: many(cashFlowEntries),
}));

export const cashFlowEntriesRelations = relations(cashFlowEntries, ({ one }) => ({
  payment: one(payments, {
    fields: [cashFlowEntries.paymentId],
    references: [payments.id],
  }),
}));
