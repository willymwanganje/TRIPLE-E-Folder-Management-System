import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';

import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

import {
  getUserPermissions,
  hasPermission,
  superAdminOnly,
} from './services/rbacService.js';

import { PERMISSIONS } from './config/permissions.js';

import * as auth from './controllers/authController.js';
import * as users from './controllers/userController.js';
import * as admin from './controllers/adminController.js';
import * as resources from './controllers/resourceController.js';

import { ensureStorage } from './services/storageService.js';

const app = express();

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

await ensureStorage();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const ALLOWED_ORIGINS_EXACT = [
  'https://triple-e-folder-management-system.vercel.app',
  'https://triple-e-folder-management-system-a.vercel.app',
  'http://localhost:5173',
];

const VERCEL_PREVIEW_PATTERN =
  /^https:\/\/triple-e-folder-management-system[a-z0-9-]*\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        ALLOWED_ORIGINS_EXACT.includes(origin) ||
        VERCEL_PREVIEW_PATTERN.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);

      return callback(
        new Error('Not allowed by CORS')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
    ],
  })
);

/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/*
|--------------------------------------------------------------------------
| STATIC UPLOADS
|--------------------------------------------------------------------------
*/

app.use(
  '/uploads',
  express.static(
    path.resolve(env.UPLOAD_DIR)
  )
);

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'TRIPLE-E Folder Management API',
    time: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| AUTH MIDDLEWARE
|--------------------------------------------------------------------------
*/

const authMw = async (req, res, next) => {
  try {
    const raw =
      req.headers.authorization || '';

    const token = raw.startsWith('Bearer ')
      ? raw.slice(7)
      : '';

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    );

    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.id,
        },

        include: {
          role: true,
        },
      });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message:
          'Your account is inactive or no longer exists.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      profilePhotoUrl:
        user.profilePhotoUrl,
      isSuperAdmin:
        user.isSuperAdmin,
      role: user.role,
      permissions:
        await getUserPermissions(
          user.id
        ),
    };

    next();
  } catch (error) {
    console.error(
      'Authentication error:',
      error
    );

    const message =
      error?.name ===
      'TokenExpiredError'
        ? 'Your session has expired. Please sign in again.'
        : 'Your session is invalid. Please sign in again.';

    return res.status(401).json({
      message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| FILE UPLOAD
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize:
      env.MAX_FILE_SIZE_MB *
      1024 *
      1024,
  },
});

const profileUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize:
      5 *
      1024 *
      1024,
  },
});

/*
|--------------------------------------------------------------------------
| DOCUMENT OWNER / ADMIN MIDDLEWARE
|--------------------------------------------------------------------------
*/

async function ownerOrManager(
  req,
  res,
  next
) {
  try {
    if (
      req.user.isSuperAdmin ||
      req.user.role?.name === 'Admin'
    ) {
      return next();
    }

    const doc =
      await prisma.document.findUnique({
        where: {
          id: req.params.id,
        },

        select: {
          uploadedById: true,
        },
      });

    if (!doc) {
      return res.status(404).json({
        message:
          'Document not found.',
      });
    }

    if (
      doc.uploadedById !==
      req.user.id
    ) {
      return res.status(403).json({
        message:
          'You can only manage your own documents.',
      });
    }

    next();
  } catch (error) {
    console.error(
      'ownerOrManager error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

app.post(
  '/api/auth/login',
  auth.login
);

app.get(
  '/api/auth/me',
  authMw,
  auth.me
);

/*
|--------------------------------------------------------------------------
| PROFILE ROUTES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/profile',
  authMw,
  users.profile
);

app.put(
  '/api/profile',
  authMw,
  hasPermission(
    PERMISSIONS.PROFILE_UPDATE
  ),
  users.saveProfile
);

app.post(
  '/api/profile/photo',
  authMw,
  hasPermission(
    PERMISSIONS.PROFILE_UPDATE
  ),
  profileUpload.single('photo'),
  users.uploadProfilePhoto
);

app.put(
  '/api/profile/password',
  authMw,
  hasPermission(
    PERMISSIONS.PROFILE_UPDATE
  ),
  users.password
);

/*
|--------------------------------------------------------------------------
| USER ROUTES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/users',
  authMw,
  hasPermission(
    PERMISSIONS.USER_VIEW
  ),
  users.users
);

app.get(
  '/api/users/:id',
  authMw,
  hasPermission(
    PERMISSIONS.USER_VIEW
  ),
  users.userById
);

app.get(
  '/api/users/:id/permissions',
  authMw,
  hasPermission(
    PERMISSIONS.ROLE_MANAGE
  ),
  users.userPermissions
);

app.put(
  '/api/users/:id/permissions',
  authMw,
  hasPermission(
    PERMISSIONS.ROLE_MANAGE
  ),
  users.saveUserPermissions
);

app.post(
  '/api/users',
  authMw,
  hasPermission(
    PERMISSIONS.USER_CREATE
  ),
  superAdminOnly,
  users.addUser
);

app.put(
  '/api/users/:id',
  authMw,
  hasPermission(
    PERMISSIONS.USER_UPDATE
  ),
  superAdminOnly,
  users.editUser
);

app.delete(
  '/api/users/:id',
  authMw,
  hasPermission(
    PERMISSIONS.USER_DELETE
  ),
  superAdminOnly,
  users.removeUser
);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/

app.get(
  '/api/dashboard',
  authMw,
  hasPermission(
    PERMISSIONS.DASHBOARD_VIEW
  ),
  admin.dashboard
);

/*
|--------------------------------------------------------------------------
| ADMIN / ROLES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/admin/roles',
  authMw,
  hasPermission(
    PERMISSIONS.ROLE_MANAGE
  ),
  admin.roles
);

app.get(
  '/api/admin/permissions',
  authMw,
  hasPermission(
    PERMISSIONS.ROLE_MANAGE
  ),
  admin.permissions
);

app.put(
  '/api/admin/roles/:id',
  authMw,
  hasPermission(
    PERMISSIONS.ROLE_MANAGE
  ),
  admin.roleUpdate
);

/*
|--------------------------------------------------------------------------
| ADMIN / SETTINGS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/admin/settings',
  authMw,
  hasPermission(
    PERMISSIONS.SETTINGS_MANAGE
  ),
  admin.settings
);

app.put(
  '/api/admin/settings',
  authMw,
  hasPermission(
    PERMISSIONS.SETTINGS_MANAGE
  ),
  admin.settingUpdate
);

/*
|--------------------------------------------------------------------------
| ADMIN / AUDIT LOGS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/admin/audit-logs',
  authMw,
  hasPermission(
    PERMISSIONS.AUDIT_VIEW
  ),
  admin.auditLogs
);

/*
|--------------------------------------------------------------------------
| CATEGORY ROUTES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/categories',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_VIEW
  ),
  resources.categories
);

app.post(
  '/api/categories',
  authMw,
  hasPermission(
    PERMISSIONS.CATEGORY_MANAGE
  ),
  resources.addCategory
);

app.put(
  '/api/categories/:id',
  authMw,
  hasPermission(
    PERMISSIONS.CATEGORY_MANAGE
  ),
  resources.editCategory
);

app.delete(
  '/api/categories/:id',
  authMw,
  hasPermission(
    PERMISSIONS.CATEGORY_MANAGE
  ),
  resources.removeCategory
);

/*
|--------------------------------------------------------------------------
| FOLDER ROUTES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/folders',
  authMw,
  hasPermission(
    PERMISSIONS.FOLDER_VIEW
  ),
  resources.folders
);

app.get(
  '/api/folders/:id',
  authMw,
  hasPermission(
    PERMISSIONS.FOLDER_VIEW
  ),
  resources.folder
);

app.post(
  '/api/folders',
  authMw,
  hasPermission(
    PERMISSIONS.FOLDER_CREATE
  ),
  resources.addFolder
);

app.put(
  '/api/folders/:id',
  authMw,
  hasPermission(
    PERMISSIONS.FOLDER_UPDATE
  ),
  resources.editFolder
);

app.delete(
  '/api/folders/:id',
  authMw,
  hasPermission(
    PERMISSIONS.FOLDER_DELETE
  ),
  resources.removeFolder
);

/*
|--------------------------------------------------------------------------
| DOCUMENT ROUTES
|--------------------------------------------------------------------------
*/

app.get(
  '/api/documents',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_VIEW
  ),
  resources.documents
);

app.get(
  '/api/documents/:id',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_VIEW
  ),
  resources.document
);

app.post(
  '/api/documents',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_CREATE
  ),
  upload.single('file'),
  resources.uploadDocument
);

app.put(
  '/api/documents/:id',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_UPDATE
  ),
  ownerOrManager,
  resources.editDocument
);

app.delete(
  '/api/documents/:id',
  authMw,
  hasPermission(
    PERMISSIONS.DOCUMENT_DELETE
  ),
  ownerOrManager,
  resources.removeDocument
);

/*
|--------------------------------------------------------------------------
| STATISTICS
|--------------------------------------------------------------------------
*/

app.get(
  '/api/stats/category',
  authMw,
  hasPermission(
    PERMISSIONS.DASHBOARD_VIEW
  ),
  resources.stats
);

/*
|--------------------------------------------------------------------------
| 404 HANDLER
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return res.status(404).json({
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (err, req, res, next) => {
    console.error(
      'GLOBAL ERROR:',
      err
    );

    if (
      err instanceof multer.MulterError
    ) {
      return res.status(400).json({
        message: err.message,
      });
    }

    if (
      err?.message ===
      'Not allowed by CORS'
    ) {
      return res.status(403).json({
        message:
          'CORS policy blocked this request.',
      });
    }

    return res.status(500).json({
      message:
        err?.message ||
        'Internal server error.',
    });
  }
);

/*
|--------------------------------------------------------------------------
| DATABASE CLEANUP
|--------------------------------------------------------------------------
*/

process.on(
  'SIGINT',
  async () => {
    await prisma.$disconnect();
    process.exit(0);
  }
);

process.on(
  'SIGTERM',
  async () => {
    await prisma.$disconnect();
    process.exit(0);
  }
);

export default app;