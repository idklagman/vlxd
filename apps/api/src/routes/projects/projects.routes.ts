import { FastifyInstance } from 'fastify';
import { db, projects, eq, and, asc } from '@vlxd/db';
import { projectSchema } from '@vlxd/shared';
import { NotFoundError } from '../../utils/errors.js';

export async function projectRoutes(app: FastifyInstance) {
  // List projects
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const query = request.query as {
      customerId?: string;
      status?: string;
    };

    const items = await db.query.projects.findMany({
      where: (p, { and, eq }) =>
        and(
          query.customerId ? eq(p.customerId, query.customerId) : undefined,
          query.status ? eq(p.status, query.status) : undefined
        ),
      with: {
        customer: true,
      },
      orderBy: [asc(projects.name)],
    });

    return {
      success: true,
      data: items,
    };
  });

  // Get project by ID
  app.get('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        customer: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Công trình');
    }

    return {
      success: true,
      data: project,
    };
  });

  // Create project
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = projectSchema.parse(request.body);

    const [created] = await db
      .insert(projects)
      .values({
        ...body,
        contactPhone: body.contactPhone || null,
        startDate: body.startDate || null,
      })
      .returning();

    return reply.status(201).send({
      success: true,
      data: created,
    });
  });

  // Update project
  app.put('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = projectSchema.parse(request.body);

    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
    if (!existing) {
      throw new NotFoundError('Công trình');
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...body,
        contactPhone: body.contactPhone || null,
        startDate: body.startDate || null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const existing = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
    if (!existing) {
      return { success: true, data: { message: 'Công trình không tồn tại hoặc đã xóa' } };
    }
    await db.delete(projects).where(eq(projects.id, id));
    return {
      success: true,
      data: { message: 'Đã xóa công trình thành công' },
    };
  });
}
