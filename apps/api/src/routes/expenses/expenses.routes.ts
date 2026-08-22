import { FastifyInstance } from 'fastify';
import { db, expenses, expenseCategories, eq, desc } from '@vlxd/db';
import { createExpenseSchema, createExpenseCategorySchema } from '@vlxd/shared';
import {
  createExpense,
  getExpenseSummary,
  getVehicleExpenseSummary,
} from '../../services/expense.service.js';

export async function expenseRoutes(app: FastifyInstance) {
  // 1. List expenses with filters
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      categoryId?: string;
      vehicleId?: string;
      driverId?: string;
      paymentMethod?: string;
      startDate?: string;
      endDate?: string;
    };

    const items = await db.query.expenses.findMany({
      where: (exp, { and, eq, gte, lte }) =>
        and(
          query.categoryId ? eq(exp.categoryId, query.categoryId) : undefined,
          query.vehicleId ? eq(exp.vehicleId, query.vehicleId) : undefined,
          query.driverId ? eq(exp.driverId, query.driverId) : undefined,
          query.paymentMethod ? eq(exp.paymentMethod, query.paymentMethod) : undefined,
          query.startDate ? gte(exp.expenseDate, query.startDate) : undefined,
          query.endDate ? lte(exp.expenseDate, query.endDate) : undefined
        ),
      with: {
        category: true,
        vehicle: true,
        driver: true,
        payment: true,
      },
      orderBy: [desc(expenses.createdAt)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // 2. Summary by category
  app.get('/summary', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as { startDate?: string; endDate?: string };
    const summary = await getExpenseSummary(query.startDate, query.endDate);
    return {
      success: true,
      data: summary,
    };
  });

  // 3. Summary by vehicle
  app.get('/vehicle-summary', { preHandler: [app.authenticate] }, async () => {
    const summary = await getVehicleExpenseSummary();
    return {
      success: true,
      data: summary,
    };
  });

  // 4. Create new expense
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createExpenseSchema.parse(request.body);
    const userId = (request.user as any)?.id;

    const expense = await createExpense(body, userId);

    return reply.status(201).send({
      success: true,
      data: expense,
    });
  });

  // 5. List expense categories
  app.get('/categories', { preHandler: [app.authenticate] }, async () => {
    const categories = await db.query.expenseCategories.findMany({
      orderBy: [expenseCategories.name],
    });
    return {
      success: true,
      data: categories,
    };
  });

  // 6. Create expense category
  app.post('/categories', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = createExpenseCategorySchema.parse(request.body);

    const [category] = await db
      .insert(expenseCategories)
      .values({
        code: body.code,
        name: body.name,
        description: body.description || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: category,
    });
  });
}
