import { FastifyInstance } from 'fastify';
import {
  getDashboardMetrics,
  getProfitReport,
  getSalesReport,
  getInventoryValuationReport,
} from '../../services/report.service.js';

export async function reportRoutes(app: FastifyInstance) {
  // 1. Dashboard summary metrics
  app.get('/dashboard', { preHandler: [app.authenticate] }, async () => {
    const data = await getDashboardMetrics();
    return {
      success: true,
      data,
    };
  });

  // 2. Profit & Loss Report
  app.get('/profit', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { startDate?: string; endDate?: string };
    const data = await getProfitReport(query.startDate, query.endDate);
    return {
      success: true,
      data,
    };
  });

  // 3. Sales & Top Items Report
  app.get('/sales', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { startDate?: string; endDate?: string; customerId?: string };
    const data = await getSalesReport(query.startDate, query.endDate, query.customerId);
    return {
      success: true,
      data,
    };
  });

  // 4. Inventory Valuation Report
  app.get('/inventory-valuation', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { warehouseId?: string };
    const data = await getInventoryValuationReport(query.warehouseId);
    return {
      success: true,
      data,
    };
  });
}
