import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ user, action, entity, entityId = '', description, metadata = {} }) => {
  try {
    if (!user) return null;
    const log = await AuditLog.create({
      user: user._id || user.id,
      userName: user.name || 'System User',
      userRole: user.role || 'SYSTEM',
      action,
      entity,
      entityId: String(entityId),
      description,
      metadata
    });
    return log;
  } catch (err) {
    console.error('[AuditLog Error]', err.message);
    return null;
  }
};