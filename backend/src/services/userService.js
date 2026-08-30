import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

export const publicUserSelect = {
  id: true, fullName: true, email: true, phone: true, profilePhotoUrl: true,
  isActive: true, isSuperAdmin: true, roleId: true, role: true, createdAt: true, updatedAt: true
};

export const listUsers = () => prisma.user.findMany({
  select: publicUserSelect,
  orderBy: { createdAt: 'desc' }
});

export const getUser = (id) => prisma.user.findUnique({ where: { id }, select: publicUserSelect });

export async function createUser({ fullName, email, phone, password, roleId }) {
  if (!fullName?.trim() || !email?.trim() || !password || !roleId) throw new Error('Full name, email, password and role are required.');
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error('Selected role was not found.');
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new Error('A user with this email already exists.');
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: { fullName: fullName.trim(), email: email.toLowerCase().trim(), phone: phone?.trim() || null, passwordHash, roleId },
    select: publicUserSelect
  });
}

export const updateUser = (id, data) => prisma.user.update({ where: { id }, data, select: publicUserSelect });
export const deleteUser = (id) => prisma.user.delete({ where: { id }, select: publicUserSelect });

export async function setUserPermissions(userId, changes) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found.');
  if (!Array.isArray(changes)) throw new Error('permissions must be an array.');

  return prisma.$transaction(async (tx) => {
    for (const item of changes) {
      if (!item.permissionId || typeof item.allowed !== 'boolean') continue;
      await tx.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId: item.permissionId } },
        update: { allowed: item.allowed },
        create: { userId, permissionId: item.permissionId, allowed: item.allowed }
      });
    }
    return tx.userPermission.findMany({
      where: { userId },
      include: { permission: true },
      orderBy: { permission: { name: 'asc' } }
    });
  });
}
