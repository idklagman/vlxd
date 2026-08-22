import { FastifyInstance } from 'fastify';
import { db, payments, eq, desc } from '@vlxd/db';
import { createPaymentReceiptSchema, createPaymentSpendSchema } from '@vlxd/shared';
import { createPaymentReceipt, createPaymentSpend } from '../../services/debt.service.js';
import { NotFoundError } from '../../utils/errors.js';

export async function paymentRoutes(app: FastifyInstance) {
  // 1. List payments
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      paymentType?: string;
      paymentMethod?: string;
      customerId?: string;
      supplierId?: string;
      startDate?: string;
      endDate?: string;
    };

    const items = await db.query.payments.findMany({
      where: (p, { and, eq, gte, lte }) =>
        and(
          query.paymentType ? eq(p.paymentType, query.paymentType) : undefined,
          query.paymentMethod ? eq(p.paymentMethod, query.paymentMethod) : undefined,
          query.customerId ? eq(p.customerId, query.customerId) : undefined,
          query.supplierId ? eq(p.supplierId, query.supplierId) : undefined,
          query.startDate ? gte(p.paymentDate, query.startDate) : undefined,
          query.endDate ? lte(p.paymentDate, query.endDate) : undefined
        ),
      with: {
        customer: true,
        project: true,
        supplier: true,
        salesOrder: true,
        purchase: true,
      },
      orderBy: [desc(payments.createdAt)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // 2. Get payment by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        customer: true,
        project: true,
        supplier: true,
        salesOrder: true,
        purchase: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Phiếu thanh toán');
    }

    return {
      success: true,
      data: payment,
    };
  });

  // 3. Create Payment Receipt (Phiếu Thu)
  app.post('/receipt', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createPaymentReceiptSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const receipt = await createPaymentReceipt(body, userId);

    return reply.status(201).send({
      success: true,
      data: receipt,
    });
  });

  // 4. Create Payment Spend Voucher (Phiếu Chi)
  app.post('/spend', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createPaymentSpendSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const voucher = await createPaymentSpend(body, userId);

    return reply.status(201).send({
      success: true,
      data: voucher,
    });
  });
}
