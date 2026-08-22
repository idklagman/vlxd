import { FastifyInstance } from 'fastify';
import { db, purchases, purchaseItems, eq, and, desc, asc } from '@vlxd/db';
import { createPurchaseSchema } from '@vlxd/shared';
import { convertToBaseQuantity, receivePurchaseOrder } from '../../services/inventory.service.js';
import { NotFoundError, BusinessRuleError } from '../../utils/errors.js';

export async function purchaseRoutes(app: FastifyInstance) {
  // List purchases
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      supplierId?: string;
      warehouseId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const items = await db.query.purchases.findMany({
      where: (p, { and, eq, gte, lte }) =>
        and(
          query.supplierId ? eq(p.supplierId, query.supplierId) : undefined,
          query.warehouseId ? eq(p.warehouseId, query.warehouseId) : undefined,
          query.status ? eq(p.status, query.status) : undefined,
          query.startDate ? gte(p.purchaseDate, query.startDate) : undefined,
          query.endDate ? lte(p.purchaseDate, query.endDate) : undefined
        ),
      with: {
        supplier: true,
        warehouse: true,
        items: {
          with: {
            productVariant: true,
            inputUnit: true,
            baseUnit: true,
          },
        },
      },
      orderBy: [desc(purchases.createdAt)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // Get purchase by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const purchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, id),
      with: {
        supplier: true,
        warehouse: true,
        items: {
          with: {
            productVariant: {
              with: {
                product: true,
                steelSpecification: true,
              },
            },
            inputUnit: true,
            baseUnit: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundError('Đơn nhập hàng');
    }

    return {
      success: true,
      data: purchase,
    };
  });

  // Create purchase (DRAFT)
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createPurchaseSchema.parse(request.body);

    const code = `NH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    let subtotal = 0;
    const processedItems: Array<{
      productVariantId: string;
      inputQuantity: number;
      inputUnitId: string;
      baseQuantity: number;
      baseUnitId: string;
      unitPrice: number;
      totalAmount: number;
      costPerBaseUnit: number;
    }> = [];

    for (const item of body.items) {
      const { baseQuantity, baseUnitId } = await convertToBaseQuantity(
        item.productVariantId,
        item.inputUnitId,
        item.inputQuantity
      );

      const totalAmount = Math.round(item.inputQuantity * item.unitPrice);
      subtotal += totalAmount;

      const costPerBaseUnit =
        baseQuantity > 0 ? Math.round(totalAmount / baseQuantity) : item.unitPrice;

      processedItems.push({
        productVariantId: item.productVariantId,
        inputQuantity: item.inputQuantity,
        inputUnitId: item.inputUnitId,
        baseQuantity,
        baseUnitId,
        unitPrice: item.unitPrice,
        totalAmount,
        costPerBaseUnit,
      });
    }

    const discountAmount = body.discountAmount || 0;
    const grandTotal = Math.max(0, subtotal - discountAmount);
    const paidAmount = body.paidAmount || 0;
    const debtAmount = Math.max(0, grandTotal - paidAmount);

    const [createdPurchase] = await db
      .insert(purchases)
      .values({
        code,
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        purchaseDate: body.purchaseDate,
        status: 'DRAFT',
        subtotalAmount: subtotal,
        discountAmount,
        grandTotal,
        paidAmount,
        debtAmount,
        notes: body.notes || null,
      })
      .returning();

    for (const pItem of processedItems) {
      await db.insert(purchaseItems).values({
        purchaseId: createdPurchase.id,
        productVariantId: pItem.productVariantId,
        inputQuantity: String(pItem.inputQuantity),
        inputUnitId: pItem.inputUnitId,
        baseQuantity: String(pItem.baseQuantity),
        baseUnitId: pItem.baseUnitId,
        unitPrice: pItem.unitPrice,
        totalAmount: pItem.totalAmount,
        costPerBaseUnit: pItem.costPerBaseUnit,
      });
    }

    return reply.status(201).send({
      success: true,
      data: createdPurchase,
    });
  });

  // Receive purchase order (Stock-in flow)
  app.post('/:id/receive', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const updated = await receivePurchaseOrder(id);
    return {
      success: true,
      data: updated,
    };
  });

  // Cancel purchase order
  app.post('/:id/cancel', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const purchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, id),
    });

    if (!purchase) {
      throw new NotFoundError('Đơn nhập hàng');
    }

    if (purchase.status !== 'DRAFT') {
      throw new BusinessRuleError('Chỉ có thể hủy đơn nhập hàng ở trạng thái Nháp (DRAFT).');
    }

    const [updated] = await db
      .update(purchases)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(purchases.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  // Delete purchase order
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const purchase = await db.query.purchases.findFirst({
      where: eq(purchases.id, id),
    });
    if (!purchase) {
      return { success: true, data: { message: 'Đơn nhập hàng không tồn tại hoặc đã xóa' } };
    }
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    await db.delete(purchases).where(eq(purchases.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa đơn nhập hàng thành công' },
    };
  });
}
