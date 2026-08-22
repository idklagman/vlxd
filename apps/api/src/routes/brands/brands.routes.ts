import { FastifyInstance } from 'fastify';
import { db, brands, eq, isNull, asc } from '@vlxd/db';
import { brandSchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function brandRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { search?: string };
    const items = await db.query.brands.findMany({
      where: (b, { and, isNull, ilike }) =>
        and(
          isNull(b.deletedAt),
          query.search ? ilike(b.name, `%${query.search}%`) : undefined
        ),
      orderBy: [asc(brands.name)],
    });

    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = brandSchema.parse(request.body);

    const existing = await db.query.brands.findFirst({
      where: eq(brands.name, body.name),
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictError(`Thương hiệu "${body.name}" đã tồn tại`);
    }

    const [created] = await db
      .insert(brands)
      .values(body)
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = brandSchema.parse(request.body);

    const existing = await db.query.brands.findFirst({
      where: (b, { and, eq, isNull }) => and(eq(b.id, id), isNull(b.deletedAt)),
    });

    if (!existing) {
      throw new NotFoundError(`Thương hiệu`);
    }

    const [updated] = await db
      .update(brands)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError(`Thương hiệu`);
    }

    await db
      .update(brands)
      .set({ deletedAt: new Date() })
      .where(eq(brands.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa thương hiệu thành công' },
    };
  });
}
