import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';

export async function ensureStorage() { await fs.mkdir(path.resolve(env.UPLOAD_DIR), { recursive: true }); }
export function publicUrl(filename) { return `/uploads/${filename}`; }
export async function saveBuffer(buffer, originalName) {
  await ensureStorage();
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${randomUUID()}-${safe}`;
  await fs.writeFile(path.resolve(env.UPLOAD_DIR, filename), buffer);
  return { filename, url: publicUrl(filename) };
}
export async function removeStoredFile(filename) { if (!filename) return; try { await fs.unlink(path.resolve(env.UPLOAD_DIR, filename)); } catch {} }
