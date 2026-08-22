import {
  db,
  customerDebts,
  supplierDebts,
  payments,
  cashFlowEntries,
  customers,
  suppliers,
  projects,
  salesOrders,
  purchases,
  eq,
  and,
  desc,
} from '@vlxd/db';
import {
  CashFlowType,
  PaymentMethod,
  CreatePaymentReceiptInput,
  CreatePaymentSpendInput,
} from '@vlxd/shared';
import { BusinessRuleError, NotFoundError } from '../utils/errors.js';

/**
 * Record an append-only entry in customer debt ledger and compute running balance.
 */
export async function recordCustomerDebt(params: {
  customerId: string;
  projectId?: string | null;
  transactionType: string; // SALE, PAYMENT, ADJUSTMENT, REFUND
  referenceType: string; // SALES_ORDER, PAYMENT, MANUAL_ADJUSTMENT
  referenceId?: string | null;
  amount: number; // Positive = Increase debt, Negative = Decrease debt
  notes?: string | null;
}) {
  const latestDebt = await db.query.customerDebts.findFirst({
    where: eq(customerDebts.customerId, params.customerId),
    orderBy: [desc(customerDebts.createdAt)],
  });

  const previousBalance = latestDebt ? latestDebt.balanceAfter : 0;
  const balanceAfter = previousBalance + params.amount;

  const [entry] = await db
    .insert(customerDebts)
    .values({
      customerId: params.customerId,
      projectId: params.projectId || null,
      transactionType: params.transactionType,
      referenceType: params.referenceType,
      referenceId: params.referenceId || null,
      amount: params.amount,
      balanceAfter,
      notes: params.notes || null,
    })
    .returning();

  return entry;
}

/**
 * Record an append-only entry in supplier debt ledger and compute running balance.
 */
export async function recordSupplierDebt(params: {
  supplierId: string;
  transactionType: string; // PURCHASE, PAYMENT, ADJUSTMENT, REFUND
  referenceType: string; // PURCHASE, PAYMENT, MANUAL_ADJUSTMENT
  referenceId?: string | null;
  amount: number; // Positive = Increase debt, Negative = Decrease debt
  notes?: string | null;
}) {
  const latestDebt = await db.query.supplierDebts.findFirst({
    where: eq(supplierDebts.supplierId, params.supplierId),
    orderBy: [desc(supplierDebts.createdAt)],
  });

  const previousBalance = latestDebt ? latestDebt.balanceAfter : 0;
  const balanceAfter = previousBalance + params.amount;

  const [entry] = await db
    .insert(supplierDebts)
    .values({
      supplierId: params.supplierId,
      transactionType: params.transactionType,
      referenceType: params.referenceType,
      referenceId: params.referenceId || null,
      amount: params.amount,
      balanceAfter,
      notes: params.notes || null,
    })
    .returning();

  return entry;
}

/**
 * Record an entry in Cash Flow ledger (Sổ quỹ Thu - Chi).
 */
export async function recordCashFlowEntry(params: {
  paymentId: string;
  accountType: 'CASH' | 'BANK';
  direction: 'IN' | 'OUT';
  amount: number;
  category: string;
  transactionDate: string;
  notes?: string | null;
}) {
  const latestEntry = await db.query.cashFlowEntries.findFirst({
    where: eq(cashFlowEntries.accountType, params.accountType),
    orderBy: [desc(cashFlowEntries.createdAt)],
  });

  const previousBalance = latestEntry ? latestEntry.balanceAfter : 0;
  const balanceChange = params.direction === CashFlowType.IN ? params.amount : -params.amount;
  const balanceAfter = previousBalance + balanceChange;

  const [entry] = await db
    .insert(cashFlowEntries)
    .values({
      paymentId: params.paymentId,
      accountType: params.accountType,
      direction: params.direction,
      amount: params.amount,
      balanceAfter,
      transactionDate: params.transactionDate,
      category: params.category,
      notes: params.notes || null,
    })
    .returning();

  return entry;
}

/**
 * Create a Payment Receipt (Phiếu Thu tiền từ khách hàng / thu khác).
 */
export async function createPaymentReceipt(input: CreatePaymentReceiptInput, createdById?: string) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, input.customerId),
  });

  if (!customer) {
    throw new NotFoundError('Khách hàng');
  }

  const code = `PT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [payment] = await db
    .insert(payments)
    .values({
      code,
      paymentType: 'RECEIPT',
      paymentMethod: input.paymentMethod,
      customerId: input.customerId,
      projectId: input.projectId || null,
      salesOrderId: input.salesOrderId || null,
      amount: input.amount,
      paymentDate: input.paymentDate,
      payerReceiverName: input.payerReceiverName || customer.name,
      notes: input.notes || null,
      createdById: createdById || null,
    })
    .returning();

  // 1. Record decrease in customer debt
  await recordCustomerDebt({
    customerId: input.customerId,
    projectId: input.projectId || null,
    transactionType: 'PAYMENT',
    referenceType: 'PAYMENT',
    referenceId: payment.id,
    amount: -input.amount, // Negative to decrease debt
    notes: `Thu tiền (${payment.code}) qua ${
      input.paymentMethod === PaymentMethod.CASH ? 'Tiền mặt' : 'Chuyển khoản'
    }: ${input.notes || ''}`,
  });

  // 2. Record cash flow entry (IN)
  const accountType = input.paymentMethod === PaymentMethod.CASH ? 'CASH' : 'BANK';
  await recordCashFlowEntry({
    paymentId: payment.id,
    accountType,
    direction: CashFlowType.IN,
    amount: input.amount,
    category: 'THU_TIEN_HANG',
    transactionDate: input.paymentDate,
    notes: `Thu tiền khách hàng ${customer.name} (${payment.code})`,
  });

  return payment;
}

/**
 * Create a Payment Spend Voucher (Phiếu Chi tiền cho NCC / chi phí khác).
 */
export async function createPaymentSpend(input: CreatePaymentSpendInput, createdById?: string) {
  let supplierName = '';
  if (input.supplierId) {
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, input.supplierId),
    });
    if (supplier) supplierName = supplier.name;
  }

  const code = `PC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  const [payment] = await db
    .insert(payments)
    .values({
      code,
      paymentType: 'PAYMENT',
      paymentMethod: input.paymentMethod,
      supplierId: input.supplierId || null,
      purchaseId: input.purchaseId || null,
      amount: input.amount,
      paymentDate: input.paymentDate,
      payerReceiverName: input.payerReceiverName || supplierName || 'Người nhận',
      notes: input.notes || null,
      createdById: createdById || null,
    })
    .returning();

  // 1. If linked to a supplier, record decrease in supplier debt
  if (input.supplierId) {
    await recordSupplierDebt({
      supplierId: input.supplierId,
      transactionType: 'PAYMENT',
      referenceType: 'PAYMENT',
      referenceId: payment.id,
      amount: -input.amount, // Negative to decrease debt
      notes: `Chi trả tiền hàng (${payment.code}) qua ${
        input.paymentMethod === PaymentMethod.CASH ? 'Tiền mặt' : 'Chuyển khoản'
      }: ${input.notes || ''}`,
    });
  }

  // 2. Record cash flow entry (OUT)
  const accountType = input.paymentMethod === PaymentMethod.CASH ? 'CASH' : 'BANK';
  await recordCashFlowEntry({
    paymentId: payment.id,
    accountType,
    direction: CashFlowType.OUT,
    amount: input.amount,
    category: input.category || 'TRA_TIEN_NCC',
    transactionDate: input.paymentDate,
    notes: `Chi tiền (${payment.code}): ${input.payerReceiverName || supplierName}`,
  });

  return payment;
}

/**
 * Get customer debts summary with project breakdown.
 */
export async function getCustomerDebtsSummary() {
  const allCustomers = await db.query.customers.findMany({
    with: {
      projects: true,
    },
    orderBy: [customers.name],
  });

  const summaries = await Promise.all(
    allCustomers.map(async (c) => {
      // Get latest total debt for this customer
      const latestDebt = await db.query.customerDebts.findFirst({
        where: eq(customerDebts.customerId, c.id),
        orderBy: [desc(customerDebts.createdAt)],
      });

      const totalDebt = latestDebt ? latestDebt.balanceAfter : 0;

      // Breakdown by project
      const projectDebts = await Promise.all(
        c.projects.map(async (p) => {
          const pEntries = await db.query.customerDebts.findMany({
            where: and(
              eq(customerDebts.customerId, c.id),
              eq(customerDebts.projectId, p.id)
            ),
          });
          const pDebt = pEntries.reduce((sum, e) => sum + e.amount, 0);
          return {
            projectId: p.id,
            projectName: p.name,
            projectStatus: p.status,
            debtAmount: pDebt,
          };
        })
      );

      return {
        customerId: c.id,
        customerName: c.name,
        customerPhone: c.phone,
        customerType: c.customerType,
        totalDebt,
        projectDebts,
      };
    })
  );

  return summaries;
}

/**
 * Get supplier debts summary.
 */
export async function getSupplierDebtsSummary() {
  const allSuppliers = await db.query.suppliers.findMany({
    orderBy: [suppliers.name],
  });

  const summaries = await Promise.all(
    allSuppliers.map(async (s) => {
      const latestDebt = await db.query.supplierDebts.findFirst({
        where: eq(supplierDebts.supplierId, s.id),
        orderBy: [desc(supplierDebts.createdAt)],
      });

      const totalDebt = latestDebt ? latestDebt.balanceAfter : 0;

      return {
        supplierId: s.id,
        supplierName: s.name,
        supplierPhone: s.phone,
        supplierAddress: s.address,
        totalDebt,
      };
    })
  );

  return summaries;
}

/**
 * Get Fund Balance and History (Sổ quỹ).
 */
export async function getFundData(accountType: 'CASH' | 'BANK') {
  const entries = await db.query.cashFlowEntries.findMany({
    where: eq(cashFlowEntries.accountType, accountType),
    with: {
      payment: true,
    },
    orderBy: [desc(cashFlowEntries.createdAt)],
    limit: 100,
  });

  const latestEntry = entries[0];
  const currentBalance = latestEntry ? latestEntry.balanceAfter : 0;

  const totalIn = entries
    .filter((e) => e.direction === CashFlowType.IN)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOut = entries
    .filter((e) => e.direction === CashFlowType.OUT)
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    accountType,
    currentBalance,
    totalIn,
    totalOut,
    entries,
  };
}
