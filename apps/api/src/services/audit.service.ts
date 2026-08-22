import { db } from '@vlxd/db';
import { auditLogs } from '@vlxd/db';

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(input: AuditLogInput) {
  await db.insert(auditLogs).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValues: input.oldValues,
    newValues: input.newValues,
    ipAddress: input.ipAddress,
  });
}
