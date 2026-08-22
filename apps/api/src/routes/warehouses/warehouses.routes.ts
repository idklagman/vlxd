import { FastifyInstance } from 'fastify';
import { db, warehouses, eq, asc } from '@vlxd/db';
import { warehouseSchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function warehouseRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const items = await db.query.warehouses.findMany({
      orderBy: [asc(warehouses.name)],
    });
    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = warehouseSchema.parse(request.body);

    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.name, body.name),
    });
    if (existing) {
      throw new ConflictError(`Kho "${body.name}" đã tồn tại`);
    }

    const [created] = await db.insert(warehouses).values(body).returning();
    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = warehouseSchema.parse(request.body);

    const existing = await db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Kho hàng');
    }

    const [updated] = await db
      .update(warehouses)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });
}
