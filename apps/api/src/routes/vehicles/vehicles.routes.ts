import { FastifyInstance } from 'fastify';
import { db, vehicles, eq, asc } from '@vlxd/db';
import { vehicleSchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function vehicleRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const items = await db.query.vehicles.findMany({
      orderBy: [asc(vehicles.name)],
    });
    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = vehicleSchema.parse(request.body);

    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.plateNumber, body.plateNumber),
    });
    if (existing) {
      throw new ConflictError(`Biển số xe "${body.plateNumber}" đã tồn tại`);
    }

    const [created] = await db.insert(vehicles).values(body).returning();
    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = vehicleSchema.parse(request.body);

    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Phương tiện xe');
    }

    const [updated] = await db
      .update(vehicles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
    });
    if (!existing) {
      return { success: true, data: { message: 'Xe không tồn tại hoặc đã xóa' } };
    }
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa xe thành công' },
    };
  });
}
