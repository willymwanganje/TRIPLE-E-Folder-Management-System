import { listCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService.js';
import { listFolders, getFolder, createFolder, updateFolder, deleteFolder } from '../services/folderService.js';
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument } from '../services/documentService.js';
import { saveBuffer, removeStoredFile } from '../services/storageService.js';
import { prisma } from '../config/prisma.js';
import { audit } from '../services/auditService.js';

export const categories = async (req, res) => res.json(await listCategories());
export const addCategory = async (req, res) => { const c = await createCategory(req.body); await audit({ userId: req.user.id, action: 'CREATE', entity: 'Category', entityId: c.id }); res.status(201).json(c); };
export const editCategory = async (req, res) => { const c = await updateCategory(req.params.id, req.body); await audit({ userId: req.user.id, action: 'UPDATE', entity: 'Category', entityId: c.id }); res.json(c); };
export const removeCategory = async (req, res) => { await deleteCategory(req.params.id); await audit({ userId: req.user.id, action: 'DELETE', entity: 'Category', entityId: req.params.id }); res.json({ message: 'Category deleted.' }); };

export const folders = async (req, res) => res.json(await listFolders(req.query, req.user));
export const folder = async (req, res) => { const f = await getFolder(req.params.id, req.user); if (!f) return res.status(404).json({ message: 'Folder not found or access denied.' }); res.json(f); };
export const addFolder = async (req, res) => {
  const f = await createFolder({
    name: req.body.name?.trim(), description: req.body.description?.trim() || null, categoryId: req.body.categoryId,
    parentId: req.body.parentId || null, createdById: req.user.id,
    accessLevel: ['PUBLIC', 'RESTRICTED', 'PRIVATE'].includes(req.body.accessLevel) ? req.body.accessLevel : 'PUBLIC',
    allowedUsers: Array.isArray(req.body.allowedUsers) ? req.body.allowedUsers : []
  });
  await audit({ userId: req.user.id, action: 'CREATE', entity: 'Folder', entityId: f.id }); res.status(201).json(f);
};
export const editFolder = async (req, res) => {
  const f = await updateFolder(req.params.id, {
    ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}), ...(req.body.description !== undefined ? { description: req.body.description?.trim() || null } : {}),
    ...(req.body.parentId !== undefined ? { parentId: req.body.parentId || null } : {}), ...(req.body.categoryId !== undefined ? { categoryId: req.body.categoryId } : {}),
    ...(req.body.accessLevel !== undefined ? { accessLevel: req.body.accessLevel } : {}), ...(req.body.allowedUsers !== undefined ? { allowedUsers: Array.isArray(req.body.allowedUsers) ? req.body.allowedUsers : [] } : {})
  });
  await audit({ userId: req.user.id, action: 'UPDATE', entity: 'Folder', entityId: f.id }); res.json(f);
};
export const removeFolder = async (req, res) => { await deleteFolder(req.params.id); await audit({ userId: req.user.id, action: 'DELETE', entity: 'Folder', entityId: req.params.id }); res.json({ message: 'Folder deleted.' }); };

export const documents = async (req, res) => res.json(await listDocuments(req.query, req.user));
export const document = async (req, res) => { const d = await getDocument(req.params.id, req.user); if (!d) return res.status(404).json({ message: 'Document not found or access denied.' }); res.json(d); };
export async function uploadDocument(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Please select a file.' });
  const saved = await saveBuffer(req.file.buffer, req.file.originalname);
  try {
    const d = await createDocument({ name: req.body.name?.trim() || req.file.originalname, description: req.body.description?.trim() || null, categoryId: req.body.categoryId, folderId: req.body.folderId || null, fileUrl: saved.url, storageKey: saved.filename, mimeType: req.file.mimetype, sizeBytes: req.file.size, uploadedById: req.user.id, accessLevel: ['PUBLIC', 'RESTRICTED', 'PRIVATE'].includes(req.body.accessLevel) ? req.body.accessLevel : 'PUBLIC', allowedUsers: Array.isArray(req.body.allowedUsers) ? req.body.allowedUsers : [] });
    await audit({ userId: req.user.id, action: 'UPLOAD', entity: 'Document', entityId: d.id }); res.status(201).json(d);
  } catch (error) { await removeStoredFile(saved.filename); throw error; }
}
export const editDocument = async (req, res) => { const d = await updateDocument(req.params.id, { ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}), ...(req.body.description !== undefined ? { description: req.body.description?.trim() || null } : {}), ...(req.body.categoryId !== undefined ? { categoryId: req.body.categoryId } : {}), ...(req.body.folderId !== undefined ? { folderId: req.body.folderId || null } : {}), ...(req.body.accessLevel !== undefined ? { accessLevel: req.body.accessLevel } : {}), ...(req.body.allowedUsers !== undefined ? { allowedUsers: Array.isArray(req.body.allowedUsers) ? req.body.allowedUsers : [] } : {}) }); await audit({ userId: req.user.id, action: 'UPDATE', entity: 'Document', entityId: d.id }); res.json(d); };
export async function removeDocument(req, res) { const d = await getDocument(req.params.id, req.user); if (!d) return res.status(404).json({ message: 'Document not found or access denied.' }); await removeStoredFile(d.storageKey); await deleteDocument(req.params.id); await audit({ userId: req.user.id, action: 'DELETE', entity: 'Document', entityId: d.id }); res.json({ message: 'Document deleted.' }); }
export const stats = async (req, res) => { const data = await prisma.$queryRaw`SELECT c.name, COUNT(d.id)::int AS count FROM "Category" c LEFT JOIN "Document" d ON d."categoryId"=c.id GROUP BY c.id ORDER BY c.name`; res.json(data); };
