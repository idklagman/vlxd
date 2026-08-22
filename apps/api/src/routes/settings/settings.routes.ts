import { FastifyInstance } from 'fastify';
import { db, systemSettings, eq } from '@vlxd/db';
import { updateSettingSchema } from './settings.schemas.js';
import { NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../../services/audit.service.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const allSettings = await db.query.systemSettings.findMany();
    return {
      success: true,
      data: allSettings,
    };
  });

  app.put('/:key', { preHandler: [app.authenticate] }, async (request, reply) => {
    const key = (request.params as any).key;
    const body = updateSettingSchema.parse(request.body);
    const decoded = request.user as any;

    const existingSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    if (!existingSetting) {
      throw new NotFoundError(`Cài đặt ${key}`);
    }

    await db.update(systemSettings)
      .set({ value: body.value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key));

    const updatedSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, key),
    });

    await createAuditLog({
      userId: decoded.id,
      action: 'UPDATE',
      entityType: 'SETTING',
      entityId: key,
      oldValues: { value: existingSetting.value },
      newValues: { value: body.value },
      ipAddress: request.ip
    });

    return {
      success: true,
      data: updatedSetting,
    };
  });
}
