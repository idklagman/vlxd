import {
  db,
  expenses,
  expenseCategories,
  payments,
  vehicles,
  eq,
  and,
  desc,
} from '@vlxd/db';
import {
  CreateExpenseInput,
  CashFlowType,
  PaymentMethod,
} from '@vlxd/shared';
import { recordCashFlowEntry } from './debt.service.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Create a new Expense record and automatically create a payment voucher + deduct cash flow.
 */
export async function createExpense(input: CreateExpenseInput, createdById?: string) {
  const category = await db.query.expenseCategories.findFirst({
    where: eq(expenseCategories.id, input.categoryId),
  });

  if (!category) {
    throw new NotFoundError('Loại chi phí');
  }

  const paymentCode = `PC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  // 1. Create linked payment voucher
  const [payment] = await db
    .insert(payments)
    .values({
      code: paymentCode,
      paymentType: 'PAYMENT',
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      paymentDate: input.expenseDate,
      payerReceiverName: input.recipientName || category.name,
      notes: input.notes || `Chi phí: ${category.name}`,
      createdById: createdById || null,
    })
    .returning();

  // 2. Record cash flow entry (OUT)
  const accountType = input.paymentMethod === PaymentMethod.CASH ? 'CASH' : 'BANK';
  await recordCashFlowEntry({
    paymentId: payment.id,
    accountType,
    direction: CashFlowType.OUT,
    amount: input.amount,
    category: category.code,
    transactionDate: input.expenseDate,
    notes: `Chi phí ${category.name}: ${input.notes || ''}`,
  });

  // 3. Create expense record
  const expenseCode = `CP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [expense] = await db
    .insert(expenses)
    .values({
      code: expenseCode,
      categoryId: input.categoryId,
      vehicleId: input.vehicleId || null,
      driverId: input.driverId || null,
      amount: input.amount,
      expenseDate: input.expenseDate,
      paymentMethod: input.paymentMethod,
      recipientName: input.recipientName || null,
      notes: input.notes || null,
      paymentId: payment.id,
      createdById: createdById || null,
    })
    .returning();

  return expense;
}

/**
 * Get expense summary by category.
 */
export async function getExpenseSummary(startDate?: string, endDate?: string) {
  const allExpenses = await db.query.expenses.findMany({
    where: (exp, { and, gte, lte }) =>
      and(
        startDate ? gte(exp.expenseDate, startDate) : undefined,
        endDate ? lte(exp.expenseDate, endDate) : undefined
      ),
    with: {
      category: true,
    },
  });

  const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategoryMap = new Map<string, { categoryName: string; categoryCode: string; amount: number; count: number }>();

  for (const e of allExpenses) {
    const catId = e.categoryId;
    const existing = byCategoryMap.get(catId) || {
      categoryName: e.category.name,
      categoryCode: e.category.code,
      amount: 0,
      count: 0,
    };
    existing.amount += e.amount;
    existing.count += 1;
    byCategoryMap.set(catId, existing);
  }

  const categoryBreakdown = Array.from(byCategoryMap.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: data.categoryName,
    categoryCode: data.categoryCode,
    amount: data.amount,
    count: data.count,
    percentage: totalAmount > 0 ? Number(((data.amount / totalAmount) * 100).toFixed(1)) : 0,
  }));

  return {
    totalAmount,
    totalCount: allExpenses.length,
    categoryBreakdown,
  };
}

/**
 * Get expense summary aggregated by vehicle.
 */
export async function getVehicleExpenseSummary() {
  const allVehicles = await db.query.vehicles.findMany();

  const vehicleSummaries = await Promise.all(
    allVehicles.map(async (v) => {
      const vExpenses = await db.query.expenses.findMany({
        where: eq(expenses.vehicleId, v.id),
        with: {
          category: true,
        },
      });

      const totalAmount = vExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        vehicleType: v.type,
        totalAmount,
        expenseCount: vExpenses.length,
      };
    })
  );

  return vehicleSummaries;
}
