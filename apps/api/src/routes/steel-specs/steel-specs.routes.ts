import { FastifyInstance } from 'fastify';
import { db, steelSpecifications, unitConversions, eq } from '@vlxd/db';
import { steelSpecificationSchema, calculateWeightPerBar } from '@vlxd/shared';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export async function steelSpecRoutes(app: FastifyInstance) {
  // List steel specs
  app.get('/', { preHandler: [app.authenticate] }, async () => {
    const items = await db.query.steelSpecifications.findMany({
      with: {
        productVariant: {
          with: {
            product: true,
          },
        },
        brand: true,
        purchaseUnit: true,
        saleUnit: true,
      },
    });

    return {
      success: true,
      data: items,
    };
  });

  // Get steel spec by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const item = await db.query.steelSpecifications.findFirst({
      where: eq(steelSpecifications.id, id),
      with: {
        productVariant: true,
        brand: true,
        purchaseUnit: true,
        saleUnit: true,
      },
    });

    if (!item) {
      throw new NotFoundError('Quy cách thép');
    }

    return {
      success: true,
      data: item,
    };
  });

  // Create steel spec
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = steelSpecificationSchema.parse(request.body);

    const existing = await db.query.steelSpecifications.findFirst({
      where: eq(steelSpecifications.productVariantId, body.productVariantId),
    });
    if (existing) {
      throw new ConflictError('Biến thể sản phẩm này đã có quy cách thép');
    }

    // Auto-calculate weightPerBar if BAR and not provided
    let calculatedWeightPerBar = body.weightPerBar;
    if (body.steelType === 'BAR' && !calculatedWeightPerBar && body.lengthPerBar) {
      calculatedWeightPerBar = calculateWeightPerBar(body.weightPerMeter, body.lengthPerBar);
    }

    const [created] = await db
      .insert(steelSpecifications)
      .values({
        ...body,
        diameter: String(body.diameter),
        lengthPerBar: body.lengthPerBar ? String(body.lengthPerBar) : null,
        weightPerMeter: String(body.weightPerMeter),
        weightPerBar: calculatedWeightPerBar ? String(calculatedWeightPerBar) : null,
      })
      .returning();

    // Auto sync conversion if BAR
    if (body.steelType === 'BAR' && calculatedWeightPerBar) {
      await db.insert(unitConversions).values({
        fromUnitId: body.saleUnitId,
        toUnitId: body.purchaseUnitId,
        conversionRate: String(calculatedWeightPerBar),
        productVariantId: body.productVariantId,
      });
    }

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  // Update steel spec
  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = steelSpecificationSchema.parse(request.body);

    const existing = await db.query.steelSpecifications.findFirst({
      where: eq(steelSpecifications.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Quy cách thép');
    }

    let calculatedWeightPerBar = body.weightPerBar;
    if (body.steelType === 'BAR' && body.lengthPerBar) {
      calculatedWeightPerBar = calculatedWeightPerBar || calculateWeightPerBar(body.weightPerMeter, body.lengthPerBar);
    }

    const [updated] = await db
      .update(steelSpecifications)
      .set({
        ...body,
        diameter: String(body.diameter),
        lengthPerBar: body.lengthPerBar ? String(body.lengthPerBar) : null,
        weightPerMeter: String(body.weightPerMeter),
        weightPerBar: calculatedWeightPerBar ? String(calculatedWeightPerBar) : null,
        updatedAt: new Date(),
      })
      .where(eq(steelSpecifications.id, id))
      .returning();

    // Update variant-scoped conversion rate for BAR
    if (body.steelType === 'BAR' && calculatedWeightPerBar) {
      const existingConv = await db.query.unitConversions.findFirst({
        where: (uc, { and, eq }) =>
          and(
            eq(uc.productVariantId, existing.productVariantId),
            eq(uc.fromUnitId, body.saleUnitId),
            eq(uc.toUnitId, body.purchaseUnitId)
          ),
      });

      if (existingConv) {
        await db
          .update(unitConversions)
          .set({ conversionRate: String(calculatedWeightPerBar), updatedAt: new Date() })
          .where(eq(unitConversions.id, existingConv.id));
      }
    }

    return {
      success: true,
      data: updated,
    };
  });
}
