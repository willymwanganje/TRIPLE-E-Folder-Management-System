import { prisma } from '../config/prisma.js';
import { getDashboard } from '../services/dashboardService.js';
import { listRoles, listPermissions, updateRole } from '../services/roleService.js';
import { listSettings, setSetting } from '../services/settingsService.js';

export const dashboard = async (req, res) => res.json(await getDashboard());
export const roles = async (req, res) => res.json(await listRoles());
export const permissions = async (req, res) => res.json(await listPermissions());
export const roleUpdate = async (req, res) => res.json(await updateRole(req.params.id, req.body.name, req.body.permissionIds || []));
export const settings = async (req, res) => res.json(await listSettings());
export const settingUpdate = async (req, res) => res.json(await setSetting(req.body.key, req.body.value));
export const auditLogs = async (req, res) => {
  const { action, entity, search } = req.query;
  res.json(await prisma.auditLog.findMany({
    where: {
      ...(action ? { action } : {}),
      ...(entity ? { entity } : {}),
      ...(search ? { OR: [{ entity: { contains: search, mode: 'insensitive' } }, { action: { contains: search, mode: 'insensitive' } }] } : {})
    },
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: 'desc' }, take: 300
  }));
};
