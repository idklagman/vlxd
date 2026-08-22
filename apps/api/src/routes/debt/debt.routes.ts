import { FastifyInstance } from 'fastify';
import { db, customerDebts, supplierDebts, eq, desc } from '@vlxd/db';
import { getCustomerDebtsSummary, getSupplierDebtsSummary } from '../../services/debt.service.js';

export async function debtRoutes(app: FastifyInstance) {
  // 1. Get customer debts summary
  app.get('/customers', { preHandler: [app.authenticate] }, async () => {
    const summary = await getCustomerDebtsSummary();
    return {
      success: true,
      data: summary,
    };
  });

  // 2. Get customer debt ledger history
  app.get('/customers/:id/ledger', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const ledger = await db.query.customerDebts.findMany({
      where: eq(customerDebts.customerId, id),
      with: {
        project: true,
      },
      orderBy: [desc(customerDebts.createdAt)],
    });

    return {
      success: true,
      data: ledger,
    };
  });

  // 3. Get supplier debts summary
  app.get('/suppliers', { preHandler: [app.authenticate] }, async () => {
    const summary = await getSupplierDebtsSummary();
    return {
      success: true,
      data: summary,
    };
  });

  // 4. Get supplier debt ledger history
  app.get('/suppliers/:id/ledger', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const ledger = await db.query.supplierDebts.findMany({
      where: eq(supplierDebts.supplierId, id),
      orderBy: [desc(supplierDebts.createdAt)],
    });

    return {
      success: true,
      data: ledger,
    };
  });
}
