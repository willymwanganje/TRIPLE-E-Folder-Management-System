import { prisma } from '../config/prisma.js';
import { ALL_PERMISSIONS } from '../config/permissions.js';

export async function getUserPermissions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  if (user.isSuperAdmin) {
    return ALL_PERMISSIONS;
  }

  const names = new Set();

  for (const row of user.role?.permissions || []) {
    if (row.permission?.name) {
      names.add(row.permission.name);
    }
  }

  for (const row of user.permissions || []) {
    if (!row.permission?.name) {
      continue;
    }

    if (row.allowed) {
      names.add(row.permission.name);
    } else {
      names.delete(row.permission.name);
    }
  }

  return [...names];
}

export function hasPermission(permission) {
  return (req, res, next) => {
    if (
      req.user?.isSuperAdmin ||
      req.user?.permissions?.includes(permission)
    ) {
      return next();
    }

    return res.status(403).json({
      message: `Permission denied: ${permission}`,
    });
  };
}

export function superAdminOnly(req, res, next) {
  if (req.user?.isSuperAdmin === true) {
    return next();
  }

  return res.status(403).json({
    message: 'Only the Super Admin can perform this action.',
  });
}

export function isPrivileged(user) {
  return Boolean(
    user?.isSuperAdmin ||
    user?.role?.name === 'Admin'
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function canAccessResource(
  user,
  resource,
  ownerField
) {
  if (!user || !resource) {
    return false;
  }

  if (user.isSuperAdmin) {
    return true;
  }

  if (resource.accessLevel === 'PUBLIC') {
    return true;
  }

  const allowed = asArray(resource.allowedUsers);

  if (allowed.includes(user.id)) {
    return true;
  }

  if (
    ownerField &&
    resource[ownerField] === user.id
  ) {
    return true;
  }

  return false;
}

export function isOwner(
  userId,
  resource,
  ownerField
) {
  return resource?.[ownerField] === userId;
}