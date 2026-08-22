import { FastifyInstance } from 'fastify';
import { db, productCategories, eq, isNull, asc, ilike } from '@vlxd/db';
import { categorySchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function categoryRoutes(app: FastifyInstance) {
  // List all categories (exclude soft-deleted)
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { search?: string };
    const items = await db.query.productCategories.findMany({
      where: (cat, { and, isNull, ilike }) =>
        and(
          isNull(cat.deletedAt),
          query.search ? ilike(cat.name, `%${query.search}%`) : undefined
        ),
      orderBy: [asc(productCategories.sortOrder), asc(productCategories.name)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // Create category
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = categorySchema.parse(request.body);

    const existing = await db.query.productCategories.findFirst({
      where: eq(productCategories.name, body.name),
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictError(`Danh mục "${body.name}" đã tồn tại`);
    }

    const [created] = await db
      .insert(productCategories)
      .values(body)
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  // Update category
  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = categorySchema.parse(request.body);

    const existing = await db.query.productCategories.findFirst({
      where: (cat, { and, eq, isNull }) => and(eq(cat.id, id), isNull(cat.deletedAt)),
    });

    if (!existing) {
      throw new NotFoundError(`Danh mục sản phẩm`);
    }

    const [updated] = await db
      .update(productCategories)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(productCategories.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  // Soft delete category
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.productCategories.findFirst({
      where: eq(productCategories.id, id),
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError(`Danh mục sản phẩm`);
    }

    await db
      .update(productCategories)
      .set({ deletedAt: new Date() })
      .where(eq(productCategories.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa danh mục thành công' },
    };
  });
}
