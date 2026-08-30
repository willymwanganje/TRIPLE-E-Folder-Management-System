import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissionData = [
  ['dashboard.view', 'View dashboard'],

  // Documents
  ['document.view', 'View documents'],
  ['document.create', 'Upload documents'],
  ['document.update', 'Edit documents'],
  ['document.delete', 'Delete documents'],
  ['document.download', 'Download documents'],

  // Folders
  ['folder.view', 'View folders'],
  ['folder.create', 'Create folders'],
  ['folder.update', 'Edit folders'],
  ['folder.delete', 'Delete folders'],
  ['folder.manage_access', 'Manage folder access'],

  // Users
  ['user.view', 'View users'],
  ['user.create', 'Create users'],
  ['user.update', 'Update users'],
  ['user.delete', 'Delete users'],
  ['user.activate', 'Activate or deactivate users'],

  // Roles & permissions
  ['role.view', 'View roles'],
  ['role.create', 'Create roles'],
  ['role.update', 'Update roles'],
  ['role.delete', 'Delete roles'],
  ['role.manage', 'Manage roles and permissions'],
  ['permission.manage', 'Manage permissions'],

  // Categories
  ['category.view', 'View categories'],
  ['category.create', 'Create categories'],
  ['category.update', 'Edit categories'],
  ['category.delete', 'Delete categories'],
  ['category.manage', 'Manage categories'],

  // Settings
  ['settings.view', 'View system settings'],
  ['settings.manage', 'Manage system settings'],

  // Audit
  ['audit.view', 'View audit logs'],

  // Profile
  ['profile.view', 'View own profile'],
  ['profile.update', 'Update own profile']
];

const categories = [
  ['Policy', 'Policies, procedures and governance documents'],
  ['Gallery', 'Gallery and media assets'],
  ['Program', 'Program documents and reports'],
  ['IDH', 'IDH project documents'],
  ['IRVC', 'IRVC project documents']
];

async function main() {
  console.log('Starting TRIPLE-E system seed...');

  // ---------------------------------------------------------
  // 1. CREATE / UPDATE PERMISSIONS
  // ---------------------------------------------------------

  for (const [name, description] of permissionData) {
    await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: {
        name,
        description
      }
    });
  }

  const permissions = await prisma.permission.findMany();

  // ---------------------------------------------------------
  // 2. CREATE ROLES
  // ---------------------------------------------------------

  const roles = {};

  const roleNames = [
    'Triple-E Super Admin',
    'Super Admin',
    'Admin',
    'User'
  ];

  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // ---------------------------------------------------------
  // 3. ROLE PERMISSIONS
  // ---------------------------------------------------------

  const allPermissionNames = permissions.map((p) => p.name);

  const rolePermissionNames = {
    /*
     * TRIPLE-E SUPER ADMIN
     * Full control of the entire system.
     */
    'Triple-E Super Admin': allPermissionNames,

    /*
     * SUPER ADMIN
     * Full operational control including users,
     * folders, files, categories, permissions and settings.
     *
     * This role can also create/manage other Super Admins
     * through the application UI.
     */
    'Super Admin': allPermissionNames,

    /*
     * ADMIN
     * Operational management of folders and documents.
     * No system-level administration.
     */
    'Admin': [
      'dashboard.view',

      'document.view',
      'document.create',
      'document.update',
      'document.delete',
      'document.download',

      'folder.view',
      'folder.create',
      'folder.update',
      'folder.delete',

      'category.view',

      'profile.view',
      'profile.update'
    ],

    /*
     * USER
     * Normal user.
     * Can manage their own documents according
     * to permissions granted by administrators.
     */
    'User': [
      'dashboard.view',

      'document.view',
      'document.create',
      'document.update',
      'document.delete',
      'document.download',

      'folder.view',

      'category.view',

      'profile.view',
      'profile.update'
    ]
  };

  for (const [roleName, permissionNames] of Object.entries(
    rolePermissionNames
  )) {
    const role = roles[roleName];

    const allowedPermissions = permissions.filter((permission) =>
      permissionNames.includes(permission.name)
    );

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: {
          notIn: allowedPermissions.map((permission) => permission.id)
        }
      }
    });

    for (const permission of allowedPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  // ---------------------------------------------------------
  // 4. CREATE / UPDATE CATEGORIES
  // ---------------------------------------------------------

  for (const [name, description] of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {
        description
      },
      create: {
        name,
        description
      }
    });
  }

  // ---------------------------------------------------------
  // 5. CREATE DEFAULT TRIPLE-E SUPER ADMIN
  // ---------------------------------------------------------

  const hash = await bcrypt.hash('Admin@12345', 12);

  await prisma.user.upsert({
    where: {
      email: 'admin@triple-e.local'
    },

    update: {
      fullName: 'Triple-E Super Admin',
      isSuperAdmin: true,
      roleId: roles['Triple-E Super Admin'].id,
      isActive: true
    },

    create: {
      fullName: 'Triple-E Super Admin',
      email: 'admin@triple-e.local',
      phone: '',
      passwordHash: hash,
      profilePhotoUrl: null,
      isSuperAdmin: true,
      isActive: true,
      roleId: roles['Triple-E Super Admin'].id
    }
  });

  // ---------------------------------------------------------
  // 6. SYSTEM SETTINGS
  // ---------------------------------------------------------

  const settings = [
    ['organization_name', 'TRIPLE-E'],
    ['system_name', 'TRIPLE-E Folder Management System'],
    ['max_upload_mb', '25'],
    ['default_access_level', 'PUBLIC']
  ];

  for (const [key, value] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value
      }
    });
  }

  console.log('');
  console.log('==========================================');
  console.log('TRIPLE-E SEED COMPLETED SUCCESSFULLY');
  console.log('==========================================');
  console.log('Default account:');
  console.log('Email: admin@triple-e.local');
  console.log('Password: Admin@12345');
  console.log('Role: Triple-E Super Admin');
  console.log('==========================================');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });