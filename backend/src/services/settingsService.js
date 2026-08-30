import { prisma } from '../config/prisma.js';

export const listSettings = () => prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });

export async function setSetting(key, value) {
  if (!key?.trim()) throw new Error('Setting key is required.');
  return prisma.systemSetting.upsert({
    where: { key: key.trim() },
    update: { value: String(value ?? '') },
    create: { key: key.trim(), value: String(value ?? '') }
  });
}
