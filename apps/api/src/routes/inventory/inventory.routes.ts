import { FastifyInstance } from 'fastify';
import {
  db,
  inventoryBalances,
  inventoryTransactions,
  productCosts,
  inventoryAdjustments,
  warehouseTransfers,
  desc,
  eq,
  and,
} from '@vlxd/db';
import {
  createInventoryAdjustmentSchema,
  createWarehouseTransferSchema,
  calculateEquivalentBars,
  formatSteelStock,
} from '@vlxd/shared';
import {
  executeInventoryAdjustment,
  executeWarehouseTransfer,
} from '../../services/inventory.service.js';

export async function inventoryRoutes(app: FastifyInstance) {
  // 1. Get realtime inventory balances with steel calculations
  app.get('/balances', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      warehouseId?: string;
      categoryId?: string;
      search?: string;
      belowMinimumStock?: string;
    };

    const balances = await db.query.inventoryBalances.findMany({
      where: (b, { and, eq }) =>
        and(query.warehouseId ? eq(b.warehouseId, query.warehouseId) : undefined),
      with: {
        warehouse: true,
        baseUnit: true,
        productVariant: {
          with: {
            product: {
              with: {
                category: true,
              },
            },
            brand: true,
            steelSpecification: true,
          },
        },
      },
      orderBy: [desc(inventoryBalances.updatedAt)],
    });

    // Map and enrich with steel bar equivalents & filter by category/search/minStock
    const enriched = balances
      .filter((b) => {
        if (query.categoryId && b.productVariant.product.categoryId !== query.categoryId) {
          return false;
        }
        if (query.search) {
          const s = query.search.toLowerCase();
          const matchName = b.productVariant.name.toLowerCase().includes(s);
          const matchProd = b.productVariant.product.name.toLowerCase().includes(s);
          const matchSku = b.productVariant.sku?.toLowerCase().includes(s);
          if (!matchName && !matchProd && !matchSku) return false;
        }
        if (query.belowMinimumStock === 'true') {
          const minStock = b.productVariant.minimumStock
            ? parseFloat(b.productVariant.minimumStock)
            : null;
          if (minStock === null || parseFloat(b.currentStock) >= minStock) {
            return false;
          }
        }
        return true;
      })
      .map((b) => {
        const currentStockNum = parseFloat(b.currentStock);
        const reservedStockNum = parseFloat(b.reservedStock);
        const availableStockNum = Number((currentStockNum - reservedStockNum).toFixed(6));
        const steelSpec = b.productVariant.steelSpecification;

        let steelCalculation = null;
        if (steelSpec && steelSpec.steelType === 'BAR' && steelSpec.weightPerBar) {
          const weightPerBarNum = parseFloat(steelSpec.weightPerBar);
          const { fullBars, remainingKg } = calculateEquivalentBars(
            currentStockNum,
            weightPerBarNum
          );
          const formattedStock = formatSteelStock(currentStockNum, weightPerBarNum);

          steelCalculation = {
            weightPerBar: weightPerBarNum,
            fullBars,
            remainingKg,
            formattedStock,
          };
        }

        return {
          id: b.id,
          warehouseId: b.warehouseId,
          warehouseName: b.warehouse.name,
          productVariantId: b.productVariantId,
          productName: b.productVariant.product.name,
          variantName: b.productVariant.name,
          sku: b.productVariant.sku,
          categoryName: b.productVariant.product.category.name,
          brandName: b.productVariant.brand?.name || null,
          baseUnitCode: b.baseUnit.code,
          baseUnitName: b.baseUnit.name,
          currentStock: currentStockNum,
          reservedStock: reservedStockNum,
          availableStock: availableStockNum,
          minimumStock: b.productVariant.minimumStock
            ? parseFloat(b.productVariant.minimumStock)
            : null,
          isLowStock:
            b.productVariant.minimumStock !== null &&
            currentStockNum < parseFloat(b.productVariant.minimumStock),
          steelCalculation,
          updatedAt: b.updatedAt,
        };
      });

    return {
      success: true,
      data: enriched,
    };
  });

  // 2. Get append-only inventory transaction ledger history
  app.get('/transactions', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      warehouseId?: string;
      productVariantId?: string;
      transactionType?: string;
      limit?: string;
    };

    const limit = query.limit ? parseInt(query.limit, 10) : 100;

    const transactions = await db.query.inventoryTransactions.findMany({
      where: (t, { and, eq }) =>
        and(
          query.warehouseId ? eq(t.warehouseId, query.warehouseId) : undefined,
          query.productVariantId ? eq(t.productVariantId, query.productVariantId) : undefined,
          query.transactionType ? eq(t.transactionType, query.transactionType) : undefined
        ),
      with: {
        warehouse: true,
        productVariant: {
          with: {
            product: true,
          },
        },
        originalUnit: true,
        baseUnit: true,
      },
      orderBy: [desc(inventoryTransactions.createdAt)],
      limit,
    });

    return {
      success: true,
      data: transactions,
    };
  });

  // 3. Create stock adjustment (Phiếu kiểm kê)
  app.post('/adjustments', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createInventoryAdjustmentSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const adjustment = await executeInventoryAdjustment(body, userId);

    return reply.status(201).send({
      success: true,
      data: adjustment,
    });
  });

  // 4. Create warehouse transfer (Phiếu chuyển kho)
  app.post('/transfers', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createWarehouseTransferSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const transfer = await executeWarehouseTransfer(body, userId);

    return reply.status(201).send({
      success: true,
      data: transfer,
    });
  });

  // 5. Get current moving average costs
  app.get('/costs', { preHandler: [app.authenticate] }, async () => {
    const costs = await db.query.productCosts.findMany({
      with: {
        productVariant: {
          with: {
            product: true,
            brand: true,
          },
        },
        baseUnit: true,
      },
      orderBy: [desc(productCosts.updatedAt)],
    });

    return {
      success: true,
      data: costs,
    };
  });
}
