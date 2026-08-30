import { prisma } from '../config/prisma.js';
import { audit } from '../services/auditService.js';
import { createUser, deleteUser, getUser, listUsers, updateUser, setUserPermissions } from '../services/userService.js';
import { changePassword, getProfile, updateProfile } from '../services/profileService.js';
import { saveBuffer } from '../services/storageService.js';

export async function profile(req, res) { res.json(await getProfile(req.user.id)); }
export async function saveProfile(req, res) { const updated = await updateProfile(req.user.id, req.body); await audit({ userId: req.user.id, action: 'PROFILE_UPDATE', entity: 'User', entityId: req.user.id }); res.json(updated); }
export async function uploadProfilePhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Please select an image.' });
  if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ message: 'Profile photo must be an image.' });
  const saved = await saveBuffer(req.file.buffer, req.file.originalname);
  const updated = await updateProfile(req.user.id, { fullName: req.user.fullName, phone: req.user.phone, profilePhotoUrl: saved.url });
  await audit({ userId: req.user.id, action: 'PROFILE_PHOTO_UPDATE', entity: 'User', entityId: req.user.id });
  res.json(updated);
}
export async function password(req, res) { await changePassword(req.user.id, req.body.currentPassword, req.body.newPassword); await audit({ userId: req.user.id, action: 'PASSWORD_CHANGE', entity: 'User', entityId: req.user.id }); res.json({ message: 'Password changed successfully.' }); }
export async function users(req, res) { res.json(await listUsers()); }
export async function userById(req, res) { const u = await getUser(req.params.id); if (!u) return res.status(404).json({ message: 'User not found.' }); res.json(u); }
export async function addUser(req, res) { const u = await createUser(req.body); await audit({ userId: req.user.id, action: 'CREATE', entity: 'User', entityId: u.id }); res.status(201).json(u); }
export async function editUser(req, res) {
  const allowed = ['fullName', 'email', 'phone', 'isActive', 'roleId'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (data.email) data.email = data.email.toLowerCase().trim();
  const target = await getUser(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  if (target.isSuperAdmin && target.id !== req.user.id) return res.status(403).json({ message: 'The Super Admin account is protected.' });
  const u = await updateUser(req.params.id, data);
  await audit({ userId: req.user.id, action: 'UPDATE', entity: 'User', entityId: u.id, metadata: data });
  res.json(u);
}
export async function removeUser(req, res) { if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account.' }); const target = await getUser(req.params.id); if (target?.isSuperAdmin) return res.status(403).json({ message: 'The Super Admin account cannot be deleted.' }); const u = await deleteUser(req.params.id); await audit({ userId: req.user.id, action: 'DELETE', entity: 'User', entityId: u.id }); res.json({ message: 'User deleted.' }); }
export async function userPermissions(req, res) { const rows = await prisma.userPermission.findMany({ where: { userId: req.params.id }, include: { permission: true } }); res.json(rows); }
export async function saveUserPermissions(req, res) { if (req.params.id === req.user.id) return res.status(400).json({ message: 'Manage your own access through the role; direct self permission overrides are disabled.' }); const target = await getUser(req.params.id); if (target?.isSuperAdmin) return res.status(403).json({ message: 'The Super Admin account is not editable from permission overrides.' }); const rows = await setUserPermissions(req.params.id, req.body.permissions); await audit({ userId: req.user.id, action: 'PERMISSIONS_UPDATE', entity: 'User', entityId: req.params.id }); res.json(rows); }
