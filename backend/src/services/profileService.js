import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

const select = { id: true, fullName: true, email: true, phone: true, profilePhotoUrl: true, isActive: true, isSuperAdmin: true, role: true, createdAt: true };
export const getProfile = (userId) => prisma.user.findUnique({ where: { id: userId }, select });

export async function updateProfile(userId, { fullName, phone, profilePhotoUrl }) {
  if (!fullName?.trim()) throw new Error('Full name is required.');
  return prisma.user.update({
    where: { id: userId },
    data: { fullName: fullName.trim(), phone: phone?.trim() || null, profilePhotoUrl: profilePhotoUrl || null },
    select
  });
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword || newPassword.length < 8) throw new Error('Current password is required and new password must be at least 8 characters.');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new Error('Current password is incorrect.');
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
