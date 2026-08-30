import { prisma } from '../config/prisma.js';
export async function getDashboard() {
  const [documents, folders, users, categories, recentDocuments, byCategory] = await Promise.all([
    prisma.document.count(), prisma.folder.count(), prisma.user.count(), prisma.category.count(),
    prisma.document.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { category:true, uploadedBy:{select:{fullName:true}}, folder:true } }),
    prisma.category.findMany({ orderBy:{name:'asc'}, include:{_count:{select:{documents:true, folders:true}}} })
  ]);
  return { counts:{documents,folders,users,categories}, recentDocuments, byCategory };
}
