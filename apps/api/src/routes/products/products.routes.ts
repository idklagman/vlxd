import { FastifyInstance } from 'fastify';
import { db, products, productVariants, eq, isNull, and, ilike } from '@vlxd/db';
import { productSchema, productVariantSchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function productRoutes(app: FastifyInstance) {
  // === PRODUCTS ===

  // List products with category, variants, brand, baseUnit, steelSpec
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      search?: string;
      categoryId?: string;
      brandId?: string;
      isActive?: string;
    };

    const items = await db.query.products.findMany({
      where: (p, { and, isNull, eq, ilike }) =>
        and(
          isNull(p.deletedAt),
          query.categoryId ? eq(p.categoryId, query.categoryId) : undefined,
          query.search ? ilike(p.name, `%${query.search}%`) : undefined,
          query.isActive !== undefined ? eq(p.isActive, query.isActive === 'true') : undefined
        ),
      with: {
        category: true,
        variants: {
          where: (v, { isNull }) => isNull(v.deletedAt),
          with: {
            brand: true,
            baseUnit: true,
            steelSpecification: true,
          },
        },
      },
    });

    return {
      success: true,
      data: items,
    };
  });

  // Get product by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const product = await db.query.products.findFirst({
      where: (p, { and, eq, isNull }) => and(eq(p.id, id), isNull(p.deletedAt)),
      with: {
        category: true,
        variants: {
          where: (v, { isNull }) => isNull(v.deletedAt),
          with: {
            brand: true,
            baseUnit: true,
            steelSpecification: true,
            conversions: {
              with: {
                fromUnit: true,
                toUnit: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Sản phẩm');
    }

    return {
      success: true,
      data: product,
    };
  });

  // Create product
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = productSchema.parse(request.body);

    const existing = await db.query.products.findFirst({
      where: eq(products.code, body.code),
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictError(`Mã sản phẩm "${body.code}" đã tồn tại`);
    }

    const [created] = await db.insert(products).values(body).returning();
    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  // Update product
  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = productSchema.parse(request.body);

    const existing = await db.query.products.findFirst({
      where: (p, { and, eq, isNull }) => and(eq(p.id, id), isNull(p.deletedAt)),
    });
    if (!existing) {
      throw new NotFoundError('Sản phẩm');
    }

    const [updated] = await db
      .update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  // Soft delete product
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Sản phẩm');
    }

    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa sản phẩm thành công' },
    };
  });

  // === PRODUCT VARIANTS ===

  // Create variant under product
  app.post('/:id/variants', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = productVariantSchema.parse({
      ...((request.body as object) || {}),
      productId: id,
    });

    const product = await db.query.products.findFirst({
      where: (p, { and, eq, isNull }) => and(eq(p.id, id), isNull(p.deletedAt)),
    });
    if (!product) {
      throw new NotFoundError('Sản phẩm');
    }

    const [created] = await db
      .insert(productVariants)
      .values({
        ...body,
        minimumStock: body.minimumStock !== undefined && body.minimumStock !== null ? String(body.minimumStock) : null,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  // Update variant
  app.put('/variants/:variantId', { preHandler: [app.authenticate] }, async (request) => {
    const { variantId } = request.params as { variantId: string };
    const body = productVariantSchema.parse(request.body);

    const existing = await db.query.productVariants.findFirst({
      where: (v, { and, eq, isNull }) => and(eq(v.id, variantId), isNull(v.deletedAt)),
    });
    if (!existing) {
      throw new NotFoundError('Biến thể sản phẩm');
    }

    const [updated] = await db
      .update(productVariants)
      .set({
        ...body,
        minimumStock: body.minimumStock !== undefined && body.minimumStock !== null ? String(body.minimumStock) : null,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  // Soft delete variant
  app.delete('/variants/:variantId', { preHandler: [app.authenticate] }, async (request) => {
    const { variantId } = request.params as { variantId: string };

    const existing = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Biến thể sản phẩm');
    }

    await db
      .update(productVariants)
      .set({ deletedAt: new Date() })
      .where(eq(productVariants.id, variantId));

    return {
      success: true,
      data: { message: 'Đã xóa biến thể thành công' },
    };
  });
}
