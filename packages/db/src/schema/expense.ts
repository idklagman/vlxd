import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  boolean,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { vehicles, drivers } from './master-data';
import { payments } from './debt-payment';

// 1. Expense Categories (Loại chi phí)
export const expenseCategories = pgTable(
  'expense_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(), // XANG_DAU, SUA_CHUA_XE, LUONG, MAT_BANG, DIEN_NUOC, CHI_KHAC
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;

// 2. Expenses (Chi phí vận hành)
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(), // CP-20260823-0001
    categoryId: uuid('category_id')
      .references(() => expenseCategories.id)
      .notNull(),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id),
    driverId: uuid('driver_id').references(() => drivers.id),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    expenseDate: date('expense_date').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('CASH'), // CASH, BANK_TRANSFER
    recipientName: varchar('recipient_name', { length: 255 }),
    notes: text('notes'),
    paymentId: uuid('payment_id').references(() => payments.id),
    createdById: uuid('created_by_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_expenses_category').on(table.categoryId),
    index('idx_expenses_vehicle').on(table.vehicleId),
    index('idx_expenses_driver').on(table.driverId),
    index('idx_expenses_date').on(table.expenseDate),
    index('idx_expenses_method').on(table.paymentMethod),
  ]
);

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

// === Relations ===

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  vehicle: one(vehicles, {
    fields: [expenses.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [expenses.driverId],
    references: [drivers.id],
  }),
  payment: one(payments, {
    fields: [expenses.paymentId],
    references: [payments.id],
  }),
  createdBy: one(users, {
    fields: [expenses.createdById],
    references: [users.id],
  }),
}));
