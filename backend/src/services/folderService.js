import { prisma } from '../config/prisma.js';
import { canAccessResource, isPrivileged } from './rbacService.js';

const include = {
  category: true,
  createdBy: { select: { id: true, fullName: true, email: true } },
  _count: { select: { documents: true, children: true } }
};

export async function listFolders({ categoryId, parentId }, user) {
  const rows = await prisma.folder.findMany({
    where: { ...(categoryId ? { categoryId } : {}), parentId: parentId || null },
    include,
    orderBy: { name: 'asc' }
  });
  return rows.filter((folder) => isPrivileged(user) || canAccessResource(user, folder, 'createdById'));
}

export async function getFolder(id, user) {
  const row = await prisma.folder.findUnique({
    where: { id },
    include: { category: true, createdBy: { select: { id: true, fullName: true, email: true } }, documents: true, children: include }
  });
  if (!row || (!isPrivileged(user) && !canAccessResource(user, row, 'createdById'))) return null;
  return row;
}

export const createFolder = (data) => prisma.folder.create({ data, include });
export const updateFolder = (id, data) => prisma.folder.update({ where: { id }, data, include });
export const deleteFolder = (id) => prisma.folder.delete({ where: { id }, include });
