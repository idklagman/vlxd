import { FastifyInstance } from 'fastify';
import { db, customers, eq, isNull, and, ilike, asc } from '@vlxd/db';
import { customerSchema } from '@vlxd/shared';
import { NotFoundError } from '../../utils/errors.js';

export async function customerRoutes(app: FastifyInstance) {
  // List customers
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      search?: string;
      customerType?: string;
    };

    const items = await db.query.customers.findMany({
      where: (c, { and, isNull, eq, ilike, or }) =>
        and(
          isNull(c.deletedAt),
          query.customerType ? eq(c.customerType, query.customerType) : undefined,
          query.search
            ? or(ilike(c.name, `%${query.search}%`), ilike(c.phone, `%${query.search}%`))
            : undefined
        ),
      with: {
        projects: true,
      },
      orderBy: [asc(customers.name)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // Get customer detail by ID with projects
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const customer = await db.query.customers.findFirst({
      where: (c, { and, eq, isNull }) => and(eq(c.id, id), isNull(c.deletedAt)),
      with: {
        projects: true,
      },
    });

    if (!customer) {
      throw new NotFoundError('Khách hàng');
    }

    return {
      success: true,
      data: customer,
    };
  });

  // Create customer
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = customerSchema.parse(request.body);

    const [created] = await db
      .insert(customers)
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

  // Update customer
  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = customerSchema.parse(request.body);

    const existing = await db.query.customers.findFirst({
      where: (c, { and, eq, isNull }) => and(eq(c.id, id), isNull(c.deletedAt)),
    });
    if (!existing) {
      throw new NotFoundError('Khách hàng');
    }

    const [updated] = await db
      .update(customers)
      .set({
        ...body,
        phone: body.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  // Soft delete customer
  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, id),
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Khách hàng');
    }

    await db
      .update(customers)
      .set({ deletedAt: new Date() })
      .where(eq(customers.id, id));

    return {
      success: true,
      data: { message: 'Đã xóa khách hàng thành công' },
    };
  });
}
