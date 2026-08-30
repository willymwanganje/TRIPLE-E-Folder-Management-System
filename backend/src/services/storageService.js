import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'triple-e-documents';

/*
|--------------------------------------------------------------------------
| ENSURE STORAGE
|--------------------------------------------------------------------------
| Called on server startup. With Supabase Storage the bucket already
| exists, so this is a no-op kept for API compatibility with the old
| local-filesystem version.
|--------------------------------------------------------------------------
*/
export async function ensureStorage() {
  // Bucket is created manually in Supabase dashboard — nothing to do here.
}

/*
|--------------------------------------------------------------------------
| PUBLIC URL
|--------------------------------------------------------------------------
*/
export function publicUrl(filename) {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}

/*
|--------------------------------------------------------------------------
| SAVE BUFFER
|--------------------------------------------------------------------------
*/
export async function saveBuffer(buffer, originalName) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${randomUUID()}-${safe}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return { filename, url: publicUrl(filename) };
}

/*
|--------------------------------------------------------------------------
| REMOVE STORED FILE
|--------------------------------------------------------------------------
*/
export async function removeStoredFile(filename) {
  if (!filename) return;

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename]);

    if (error) {
      console.warn(`Failed to delete file from Supabase Storage: ${error.message}`);
    }
  } catch (err) {
    console.warn('removeStoredFile error:', err);
  }
}