export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  FOLDER_VIEW: 'folder.view',
  FOLDER_CREATE: 'folder.create',
  FOLDER_UPDATE: 'folder.update',
  FOLDER_DELETE: 'folder.delete',
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  ROLE_MANAGE: 'role.manage',
  CATEGORY_MANAGE: 'category.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_VIEW: 'audit.view',
  PROFILE_UPDATE: 'profile.update'
});

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const PERMISSION_GROUPS = [
  { key: 'Dashboard', items: ['dashboard.view'] },
  { key: 'Documents', items: ['document.view', 'document.create', 'document.update', 'document.delete'] },
  { key: 'Folders', items: ['folder.view', 'folder.create', 'folder.update', 'folder.delete'] },
  { key: 'Users', items: ['user.view', 'user.create', 'user.update', 'user.delete'] },
  { key: 'Administration', items: ['role.manage', 'category.manage', 'settings.manage', 'audit.view'] },
  { key: 'Profile', items: ['profile.update'] }
];
