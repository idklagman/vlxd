import { FastifyInstance } from 'fastify';
import { db, units, unitConversions, eq, asc } from '@vlxd/db';
import { unitSchema, unitConversionSchema } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function unitRoutes(app: FastifyInstance) {
  // === UNITS ===
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const items = await db.query.units.findMany({
      orderBy: [asc(units.code)],
    });
    return {
      success: true,
      data: items,
    };
  });

  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = unitSchema.parse(request.body);

    const existing = await db.query.units.findFirst({
      where: eq(units.code, body.code),
    });
    if (existing) {
      throw new ConflictError(`Mã đơn vị "${body.code}" đã tồn tại`);
    }

    const [created] = await db.insert(units).values(body).returning();
    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = unitSchema.parse(request.body);

    const existing = await db.query.units.findFirst({
      where: eq(units.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Đơn vị tính');
    }

    const [updated] = await db
      .update(units)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(units.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const existing = await db.query.units.findFirst({
      where: eq(units.id, id),
    });
    if (!existing) {
      return { success: true, data: { message: 'Đơn vị không tồn tại hoặc đã xóa' } };
    }
    // Delete any unit conversions using this unit
    await db.delete(unitConversions).where(eq(unitConversions.fromUnitId, id));
    await db.delete(unitConversions).where(eq(unitConversions.toUnitId, id));
    await db.delete(units).where(eq(units.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa đơn vị tính thành công' },
    };
  });

  // === UNIT CONVERSIONS ===
  app.get('/conversions', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { variantId?: string };

    const items = await db.query.unitConversions.findMany({
      where: (uc, { eq, isNull, or }) =>
        query.variantId
          ? or(eq(uc.productVariantId, query.variantId), isNull(uc.productVariantId))
          : undefined,
      with: {
        fromUnit: true,
        toUnit: true,
        productVariant: true,
      },
    });

    return {
      success: true,
      data: items,
    };
  });

  app.post('/conversions', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = unitConversionSchema.parse(request.body);

    const [created] = await db
      .insert(unitConversions)
      .values({
        fromUnitId: body.fromUnitId,
        toUnitId: body.toUnitId,
        conversionRate: String(body.conversionRate),
        productVariantId: body.productVariantId || null,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  app.delete('/conversions/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.unitConversions.findFirst({
      where: eq(unitConversions.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Quy đổi đơn vị');
    }

    await db.delete(unitConversions).where(eq(unitConversions.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa quy đổi đơn vị thành công' },
    };
  });
}
