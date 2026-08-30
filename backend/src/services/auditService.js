import { prisma } from '../config/prisma.js';

export async function audit({ userId, action, entity, entityId, metadata }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata: metadata ? JSON.stringify(metadata) : null } });
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
}
