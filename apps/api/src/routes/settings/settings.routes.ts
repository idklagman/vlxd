import { FastifyInstance } from 'fastify';
import { db, systemSettings, eq } from '@vlxd/db';
import { updateSettingSchema } from './settings.schemas.js';
import { NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../../services/audit.service.js';

export async function settingsRoutes(app: FastifyInstance) {
  // Public endpoint for Login page and unauthenticated views
  app.get('/public', async () => {
    const allSettings = await db.query.systemSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of allSettings) {
      map[s.key] = s.value;
    }
    return {
      success: true,
      data: {
        storeName: map['store.name'] || 'Cửa hàng VLXD Ton Thủy',
        storePhone: map['store.phone'] || '0987593703',
        storeAddress: map['store.address'] || 'Yên Vỹ, Tam Giang, Bắc Ninh',
        bankName: map['bank.name'] || 'VietinBank',
        bankAccount: map['bank.account_number'] || '12283456',
        bankAccountName: map['bank.account_name'] || 'NGUYEN DUC LONG',
      },
    };
  });

  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const allSettings = await db.query.systemSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of allSettings) {
      map[s.key] = s.value;
    }
    return {
      success: true,
      data: {
        storeName: map['store.name'] || 'Cửa hàng VLXD Ton Thủy',
        storePhone: map['store.phone'] || '0987593703',
        storeAddress: map['store.address'] || 'Yên Vỹ, Tam Giang, Bắc Ninh',
        bankName: map['bank.name'] || 'VietinBank',
        bankAccount: map['bank.account_number'] || '12283456',
        bankAccountName: map['bank.account_name'] || 'NGUYEN DUC LONG',
        items: allSettings,
      },
    };
  });

  app.put('/', { preHandler: [app.authenticate] }, async (request) => {
    const body = request.body as any;
    const mapping: Record<string, string> = {
      storeName: 'store.name',
      storePhone: 'store.phone',
      storeAddress: 'store.address',
      bankName: 'bank.name',
      bankAccount: 'bank.account_number',
      bankAccountName: 'bank.account_name',
    };

    for (const [field, key] of Object.entries(mapping)) {
      if (body[field] !== undefined) {
        const val = String(body[field]);
        const existing = await db.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
        });
        if (existing) {
          await db
            .update(systemSettings)
            .set({ value: val, updatedAt: new Date() })
            .where(eq(systemSettings.key, key));
        } else {
          await db.insert(systemSettings).values({
            key,
            value: val,
            group: key.startsWith('store.') ? 'store' : 'bank',
            description: key,
          });
        }
      }
    }

    const allSettings = await db.query.systemSettings.findMany();
    const map: Record<string, string> = {};
    for (const s of allSettings) {
      map[s.key] = s.value;
    }
    return {
      success: true,
      data: {
        storeName: map['store.name'] || 'Cửa hàng VLXD',
        storePhone: map['store.phone'] || '0987654321',
        storeAddress: map['store.address'] || 'Hương Sơn, Mỹ Đức, Hà Nội',
        bankName: map['bank.name'] || 'VietinBank',
        bankAccount: map['bank.account_number'] || '12283456',
        bankAccountName: map['bank.account_name'] || 'NGUYEN VAN CHU',
        items: allSettings,
      },
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
