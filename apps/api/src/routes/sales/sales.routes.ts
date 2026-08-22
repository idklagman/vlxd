import { FastifyInstance } from 'fastify';
import { db, salesOrders, salesOrderItems, eq, and, desc } from '@vlxd/db';
import { createSalesOrderSchema } from '@vlxd/shared';
import {
  createSalesOrder,
  confirmSalesOrder,
  dispatchSalesOrder,
  completeSalesOrder,
  cancelSalesOrder,
  getLastSoldPrice,
} from '../../services/sales.service.js';
import { NotFoundError } from '../../utils/errors.js';

export async function salesRoutes(app: FastifyInstance) {
  // 1. List sales orders
  app.get('/orders', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      customerId?: string;
      projectId?: string;
      warehouseId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    };

    const orders = await db.query.salesOrders.findMany({
      where: (o, { and, eq, gte, lte }) =>
        and(
          query.customerId ? eq(o.customerId, query.customerId) : undefined,
          query.projectId ? eq(o.projectId, query.projectId) : undefined,
          query.warehouseId ? eq(o.warehouseId, query.warehouseId) : undefined,
          query.status ? eq(o.status, query.status) : undefined,
          query.startDate ? gte(o.orderDate, query.startDate) : undefined,
          query.endDate ? lte(o.orderDate, query.endDate) : undefined
        ),
      with: {
        customer: true,
        project: true,
        warehouse: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
                steelSpecification: true,
              },
            },
            inputUnit: true,
            baseUnit: true,
          },
        },
      },
      orderBy: [desc(salesOrders.createdAt)],
    });

    return {
      success: true,
      data: orders,
    };
  });

  // 2. Get single sales order by ID
  app.get('/orders/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const order = await db.query.salesOrders.findFirst({
      where: eq(salesOrders.id, id),
      with: {
        customer: true,
        project: true,
        warehouse: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: {
                  with: {
                    category: true,
                  },
                },
                brand: true,
                steelSpecification: true,
              },
            },
            inputUnit: true,
            baseUnit: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Đơn bán hàng');
    }

    return {
      success: true,
      data: order,
    };
  });

  // 3. Create sales order (DRAFT)
  app.post('/orders', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createSalesOrderSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const order = await createSalesOrder(body, userId);

    return reply.status(201).send({
      success: true,
      data: order,
    });
  });

  // 4. Confirm sales order (Reserve stock)
  app.post('/orders/:id/confirm', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await confirmSalesOrder(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 5. Dispatch sales order (Deduct current stock + record SALE_OUT)
  app.post('/orders/:id/dispatch', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await dispatchSalesOrder(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 6. Complete sales order
  app.post('/orders/:id/complete', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await completeSalesOrder(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 7. Cancel sales order (Release reserved stock / reverse stock-out)
  app.post('/orders/:id/cancel', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await cancelSalesOrder(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 8. Get last sold price suggestion for customer
  app.get('/pricing/last-sold', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      customerId?: string;
      productVariantId?: string;
    };

    if (!query.customerId || !query.productVariantId) {
      return { success: true, data: null };
    }

    const lastPrice = await getLastSoldPrice(query.customerId, query.productVariantId);
    return {
      success: true,
      data: lastPrice,
    };
  });
}
