import { FastifyInstance } from 'fastify';
import { db, deliveries, eq, desc } from '@vlxd/db';
import { createDeliverySchema } from '@vlxd/shared';
import {
  createDeliveryTrip,
  dispatchDeliveryTrip,
  completeDeliveryTrip,
  cancelDeliveryTrip,
} from '../../services/delivery.service.js';
import { NotFoundError } from '../../utils/errors.js';

export async function deliveryRoutes(app: FastifyInstance) {
  // 1. List delivery trips
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      salesOrderId?: string;
      vehicleId?: string;
      driverId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const items = await db.query.deliveries.findMany({
      where: (d, { and, eq, gte, lte }) =>
        and(
          query.salesOrderId ? eq(d.salesOrderId, query.salesOrderId) : undefined,
          query.vehicleId ? eq(d.vehicleId, query.vehicleId) : undefined,
          query.driverId ? eq(d.driverId, query.driverId) : undefined,
          query.status ? eq(d.status, query.status) : undefined,
          query.startDate ? gte(d.deliveryDate, query.startDate) : undefined,
          query.endDate ? lte(d.deliveryDate, query.endDate) : undefined
        ),
      with: {
        salesOrder: {
          with: {
            customer: true,
            project: true,
          },
        },
        vehicle: true,
        driver: true,
        items: {
          with: {
            productVariant: true,
            unit: true,
          },
        },
      },
      orderBy: [desc(deliveries.createdAt)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // 2. Get delivery by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const delivery = await db.query.deliveries.findFirst({
      where: eq(deliveries.id, id),
      with: {
        salesOrder: {
          with: {
            customer: true,
            project: true,
            warehouse: true,
          },
        },
        vehicle: true,
        driver: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
              },
            },
            unit: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundError('Chuyến xe giao hàng');
    }

    return {
      success: true,
      data: delivery,
    };
  });

  // 3. Create delivery trip
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createDeliverySchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const delivery = await createDeliveryTrip(body, userId);

    return reply.status(201).send({
      success: true,
      data: delivery,
    });
  });

  // 4. Dispatch trip (IN_TRANSIT)
  app.post('/:id/dispatch', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await dispatchDeliveryTrip(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 5. Complete trip (DELIVERED)
  app.post('/:id/complete', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await completeDeliveryTrip(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 6. Cancel trip
  app.post('/:id/cancel', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await cancelDeliveryTrip(id);
    return {
      success: true,
      data: updated,
    };
  });

  // 7. Delete trip
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const delivery = await db.query.deliveries.findFirst({
      where: eq(deliveries.id, id),
    });
    if (!delivery) {
      return { success: true, data: { message: 'Chuyến xe không tồn tại hoặc đã xóa' } };
    }
    await db.delete(deliveries).where(eq(deliveries.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa chuyến xe thành công' },
    };
  });
}
