import { prisma } from '../config/prisma.js';

export const listRoles = () => prisma.role.findMany({
  include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
  orderBy: { name: 'asc' }
});

export const listPermissions = () => prisma.permission.findMany({ orderBy: { name: 'asc' } });

export async function updateRole(id, name, permissionIds = []) {
  if (!name?.trim()) throw new Error('Role name is required.');
  return prisma.$transaction(async (tx) => {
    const role = await tx.role.update({ where: { id }, data: { name: name.trim() } });
    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    const ids = [...new Set(permissionIds)].filter(Boolean);
    if (ids.length) await tx.rolePermission.createMany({ data: ids.map((permissionId) => ({ roleId: id, permissionId })) });
    return tx.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } }
    });
  });
}
