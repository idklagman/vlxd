import { FastifyInstance } from 'fastify';
import { db, drivers, eq, asc } from '@vlxd/db';
import { driverSchema } from '@vlxd/shared';
import { NotFoundError } from '../../utils/errors.js';

export async function driverRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const items = await db.query.drivers.findMany({
      orderBy: [asc(drivers.name)],
    });
    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = driverSchema.parse(request.body);

    const [created] = await db
      .insert(drivers)
      .values({
        ...body,
        phone: body.phone || null,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = driverSchema.parse(request.body);

    const existing = await db.query.drivers.findFirst({
      where: eq(drivers.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Tài xế');
    }

    const [updated] = await db
      .update(drivers)
      .set({
        ...body,
        phone: body.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const existing = await db.query.drivers.findFirst({
      where: eq(drivers.id, id),
    });
    if (!existing) {
      return { success: true, data: { message: 'Tài xế không tồn tại hoặc đã xóa' } };
    }
    await db.delete(drivers).where(eq(drivers.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa tài xế thành công' },
    };
  });
}
