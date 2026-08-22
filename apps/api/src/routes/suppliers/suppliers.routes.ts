import { FastifyInstance } from 'fastify';
import { db, suppliers, eq, isNull, and, ilike, asc } from '@vlxd/db';
import { supplierSchema } from '@vlxd/shared';
import { NotFoundError } from '../../utils/errors.js';

export async function supplierRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { search?: string };

    const items = await db.query.suppliers.findMany({
      where: (s, { and, isNull, ilike, or }) =>
        and(
          isNull(s.deletedAt),
          query.search
            ? or(ilike(s.name, `%${query.search}%`), ilike(s.phone, `%${query.search}%`))
            : undefined
        ),
      orderBy: [asc(suppliers.name)],
    });

    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = supplierSchema.parse(request.body);

    const [created] = await db
      .insert(suppliers)
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
    const body = supplierSchema.parse(request.body);

    const existing = await db.query.suppliers.findFirst({
      where: (s, { and, eq, isNull }) => and(eq(s.id, id), isNull(s.deletedAt)),
    });
    if (!existing) {
      throw new NotFoundError('Nhà cung cấp');
    }

    const [updated] = await db
      .update(suppliers)
      .set({
        ...body,
        phone: body.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, id),
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Nhà cung cấp');
    }

    await db
      .update(suppliers)
      .set({ deletedAt: new Date() })
      .where(eq(suppliers.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa nhà cung cấp thành công' },
    };
  });
}
