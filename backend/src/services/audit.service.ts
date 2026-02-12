import { Types } from 'mongoose';
import { AuditLog } from '../models/audit-log.model';
import { logger } from '../utils/logger';

export const logAudit = async (
  action: string,
  entityType: string,
  entityId: Types.ObjectId,
  performedBy: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      metadata,
      ipAddress,
    });
  } catch (err) {
    // Audit logging should never crash the request
    logger.error({ err, action, entityType, entityId }, 'Failed to create audit log');
  }
};
