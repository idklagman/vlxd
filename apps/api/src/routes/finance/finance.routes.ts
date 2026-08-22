import { FastifyInstance } from 'fastify';
import { getFundData } from '../../services/debt.service.js';

export async function financeRoutes(app: FastifyInstance) {
  // 1. Get Cash Register fund data (Sổ quỹ Tiền mặt)
  app.get('/cash', { preHandler: [app.authenticate] }, async () => {
    const data = await getFundData('CASH');
    return {
      success: true,
      data,
    };
  });

  // 2. Get Bank Fund data (Sổ phụ Ngân hàng)
  app.get('/bank', { preHandler: [app.authenticate] }, async () => {
    const data = await getFundData('BANK');
    return {
      success: true,
      data,
    };
  });
}
