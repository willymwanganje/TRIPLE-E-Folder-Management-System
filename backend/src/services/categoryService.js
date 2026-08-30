import { prisma } from '../config/prisma.js';

export const listCategories = () => prisma.category.findMany({ orderBy: { name: 'asc' } });
export const createCategory = (data) => prisma.category.create({ data: { name: data.name.trim(), description: data.description?.trim() || null } });
export const updateCategory = (id, data) => prisma.category.update({ where: { id }, data: { name: data.name?.trim(), description: data.description?.trim() || null } });
export const deleteCategory = (id) => prisma.category.delete({ where: { id } });
