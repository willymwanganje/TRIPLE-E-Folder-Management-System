import { prisma } from '../config/prisma.js';
import { canAccessResource, isPrivileged } from './rbacService.js';

const include = {
  category: true,
  folder: { select: { id: true, name: true, accessLevel: true, allowedUsers: true } },
  uploadedBy: { select: { id: true, fullName: true, email: true } }
};

function visible(user, doc) {
  if (isPrivileged(user)) return true;
  if (!canAccessResource(user, doc, 'uploadedById')) return false;
  if (doc.folder && !canAccessResource(user, doc.folder, null)) return false;
  return true;
}

export async function listDocuments({ categoryId, folderId, search }, user) {
  const rows = await prisma.document.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(folderId ? { folderId } : {}),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {})
    },
    include,
    orderBy: { createdAt: 'desc' }
  });
  return rows.filter((doc) => visible(user, doc));
}

export async function getDocument(id, user) {
  const row = await prisma.document.findUnique({ where: { id }, include });
  if (!row || !visible(user, row)) return null;
  return row;
}

export const createDocument = (data) => prisma.document.create({ data, include });
export const updateDocument = (id, data) => prisma.document.update({ where: { id }, data, include });
export const deleteDocument = (id) => prisma.document.delete({ where: { id }, include });
