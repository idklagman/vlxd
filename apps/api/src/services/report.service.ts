import {
  db,
  salesOrders,
  salesOrderItems,
  expenses,
  expenseCategories,
  inventoryBalances,
  productVariants,
  products,
  productCategories,
  units,
  productCosts,
  customerDebts,
  supplierDebts,
  cashFlowEntries,
  warehouses,
  eq,
  and,
  desc,
  ne,
  gte,
  lte,
} from '@vlxd/db';
import { OrderStatus, CashFlowType } from '@vlxd/shared';

/**
 * Executive Dashboard summary metrics.
 */
export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  // 1. Sales & Revenue this month (Excluding CANCELLED)
  const monthOrders = await db.query.salesOrders.findMany({
    where: and(
      gte(salesOrders.orderDate, startOfMonth),
      ne(salesOrders.status, OrderStatus.CANCELLED)
    ),
    with: {
      items: true,
    },
  });

  const revenueThisMonth = monthOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const orderCountThisMonth = monthOrders.length;

  let cogsThisMonth = 0;
  for (const o of monthOrders) {
    for (const it of o.items) {
      const baseQty = parseFloat(it.baseQuantity) || 0;
      cogsThisMonth += Math.round(baseQty * (it.costPerBaseUnit || 0));
    }
  }

  const grossProfitThisMonth = Math.max(0, revenueThisMonth - cogsThisMonth);

  // 2. Expenses this month
  const monthExpenses = await db.query.expenses.findMany({
    where: gte(expenses.expenseDate, startOfMonth),
  });
  const expensesThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfitThisMonth = grossProfitThisMonth - expensesThisMonth;

  // 3. Fund balances
  const latestCash = await db.query.cashFlowEntries.findFirst({
    where: eq(cashFlowEntries.accountType, 'CASH'),
    orderBy: [desc(cashFlowEntries.createdAt)],
  });
  const cashBalance = latestCash ? latestCash.balanceAfter : 0;

  const latestBank = await db.query.cashFlowEntries.findFirst({
    where: eq(cashFlowEntries.accountType, 'BANK'),
    orderBy: [desc(cashFlowEntries.createdAt)],
  });
  const bankBalance = latestBank ? latestBank.balanceAfter : 0;

  // 4. Customer Debts & Supplier Debts total
  const allCustomerDebts = await db.query.customerDebts.findMany({
    orderBy: [desc(customerDebts.createdAt)],
  });
  const seenCust = new Set<string>();
  let totalCustomerDebt = 0;
  for (const d of allCustomerDebts) {
    if (!seenCust.has(d.customerId)) {
      seenCust.add(d.customerId);
      if (d.balanceAfter > 0) totalCustomerDebt += d.balanceAfter;
    }
  }

  const allSupplierDebts = await db.query.supplierDebts.findMany({
    orderBy: [desc(supplierDebts.createdAt)],
  });
  const seenSup = new Set<string>();
  let totalSupplierDebt = 0;
  for (const d of allSupplierDebts) {
    if (!seenSup.has(d.supplierId)) {
      seenSup.add(d.supplierId);
      if (d.balanceAfter > 0) totalSupplierDebt += d.balanceAfter;
    }
  }

  // 5. Recent pending orders
  const pendingOrders = await db.query.salesOrders.findMany({
    where: and(
      ne(salesOrders.status, OrderStatus.COMPLETED),
      ne(salesOrders.status, OrderStatus.CANCELLED)
    ),
    with: {
      customer: true,
      project: true,
    },
    orderBy: [desc(salesOrders.createdAt)],
    limit: 6,
  });

  // 6. Low stock alerts
  const balances = await db.query.inventoryBalances.findMany({
    with: {
      productVariant: {
        with: {
          product: true,
        },
      },
      warehouse: true,
      baseUnit: true,
    },
  });

  const lowStockItems = balances
    .filter((b) => {
      const cur = parseFloat(b.currentStock) || 0;
      const min = parseFloat(b.productVariant.minimumStock || '0');
      return min > 0 && cur <= min;
    })
    .map((b) => ({
      variantId: b.productVariantId,
      variantName: b.productVariant.name,
      productName: b.productVariant.product.name,
      warehouseName: b.warehouse.name,
      currentStock: parseFloat(b.currentStock),
      minStockLevel: parseFloat(b.productVariant.minimumStock || '0'),
      unitCode: b.baseUnit.code,
    }))
    .slice(0, 8);

  return {
    revenueThisMonth,
    orderCountThisMonth,
    grossProfitThisMonth,
    expensesThisMonth,
    netProfitThisMonth,
    cashBalance,
    bankBalance,
    totalCustomerDebt,
    totalSupplierDebt,
    pendingOrders,
    lowStockItems,
  };
}

/**
 * Profit & Loss (P&L) Report with real COGS snapshots.
 */
export async function getProfitReport(startDate?: string, endDate?: string) {
  const orders = await db.query.salesOrders.findMany({
    where: (o, { and, gte, lte, ne }) =>
      and(
        ne(o.status, OrderStatus.CANCELLED),
        startDate ? gte(o.orderDate, startDate) : undefined,
        endDate ? lte(o.orderDate, endDate) : undefined
      ),
    with: {
      items: true,
    },
  });

  let grossRevenue = 0;
  let totalDiscount = 0;
  let totalShippingFee = 0;
  let totalCogs = 0;

  for (const o of orders) {
    grossRevenue += o.subtotalAmount;
    totalDiscount += o.discountAmount;
    totalShippingFee += o.shippingFee;

    for (const it of o.items) {
      const baseQty = parseFloat(it.baseQuantity) || 0;
      totalCogs += Math.round(baseQty * (it.costPerBaseUnit || 0));
    }
  }

  const netRevenue = Math.max(0, grossRevenue - totalDiscount);
  const grossProfit = netRevenue - totalCogs;
  const grossMarginPct = netRevenue > 0 ? Number(((grossProfit / netRevenue) * 100).toFixed(1)) : 0;

  // Operating Expenses
  const expenseRecords = await db.query.expenses.findMany({
    where: (exp, { and, gte, lte }) =>
      and(
        startDate ? gte(exp.expenseDate, startDate) : undefined,
        endDate ? lte(exp.expenseDate, endDate) : undefined
      ),
    with: {
      category: true,
    },
  });

  const totalExpenses = expenseRecords.reduce((sum, e) => sum + e.amount, 0);

  const byCategoryMap = new Map<string, { name: string; amount: number }>();
  for (const exp of expenseRecords) {
    const catName = exp.category.name;
    const cur = byCategoryMap.get(catName) || { name: catName, amount: 0 };
    cur.amount += exp.amount;
    byCategoryMap.set(catName, cur);
  }

  const expenseBreakdown = Array.from(byCategoryMap.values());
  const netProfit = grossProfit - totalExpenses + totalShippingFee;
  const totalIncome = netRevenue + totalShippingFee;
  const netMarginPct = totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(1)) : 0;

  return {
    grossRevenue,
    totalDiscount,
    netRevenue,
    totalShippingFee,
    totalCogs,
    grossProfit,
    grossMarginPct,
    totalExpenses,
    expenseBreakdown,
    netProfit,
    netMarginPct,
    orderCount: orders.length,
  };
}

/**
 * Top selling items & sales breakdown report.
 */
export async function getSalesReport(startDate?: string, endDate?: string, customerId?: string) {
  const orders = await db.query.salesOrders.findMany({
    where: (o, { and, gte, lte, ne, eq }) =>
      and(
        ne(o.status, OrderStatus.CANCELLED),
        startDate ? gte(o.orderDate, startDate) : undefined,
        endDate ? lte(o.orderDate, endDate) : undefined,
        customerId ? eq(o.customerId, customerId) : undefined
      ),
    with: {
      customer: true,
      project: true,
      items: {
        with: {
          productVariant: {
            with: {
              product: true,
            },
          },
          inputUnit: true,
        },
      },
    },
    orderBy: [desc(salesOrders.orderDate)],
  });

  const itemMap = new Map<string, { variantName: string; unitCode: string; totalQty: number; totalRevenue: number }>();

  for (const o of orders) {
    for (const it of o.items) {
      const vId = it.productVariantId;
      const cur = itemMap.get(vId) || {
        variantName: it.productVariant.name,
        unitCode: it.inputUnit.code,
        totalQty: 0,
        totalRevenue: 0,
      };
      cur.totalQty += parseFloat(it.inputQuantity) || 0;
      cur.totalRevenue += it.totalAmount;
      itemMap.set(vId, cur);
    }
  }

  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  const totalSales = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  return {
    totalSales,
    orderCount: orders.length,
    topItems,
    orders,
  };
}

/**
 * Inventory Valuation Report (Total asset valuation = Stock * Moving Average Cost).
 */
export async function getInventoryValuationReport(warehouseId?: string) {
  const balances = await db.query.inventoryBalances.findMany({
    where: warehouseId ? eq(inventoryBalances.warehouseId, warehouseId) : undefined,
    with: {
      productVariant: {
        with: {
          product: {
            with: {
              category: true,
            },
          },
        },
      },
      warehouse: true,
      baseUnit: true,
    },
  });

  const costs = await db.query.productCosts.findMany();
  const costMap = new Map(costs.map((c) => [c.productVariantId, c.averageCost]));

  let totalInventoryValue = 0;

  const items = balances.map((b) => {
    const stock = parseFloat(b.currentStock) || 0;
    const avgCost = costMap.get(b.productVariantId) || 0;
    const totalValue = Math.round(stock * avgCost);
    totalInventoryValue += totalValue;

    return {
      variantId: b.productVariantId,
      variantName: b.productVariant.name,
      productName: b.productVariant.product.name,
      categoryName: b.productVariant.product.category?.name || 'Khác',
      warehouseName: b.warehouse.name,
      currentStock: stock,
      baseUnitCode: b.baseUnit.code,
      averageCost: avgCost,
      totalValue,
    };
  });

  items.sort((a, b) => b.totalValue - a.totalValue);

  return {
    totalInventoryValue,
    itemCount: items.length,
    items,
  };
}
