'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

const ALLOWED_BUCKETS = new Set(['dishes-images', 'promos-images', 'menu-templates']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function sanitizeFileName(name: string): string {
  const base = name.split('.').shift() ?? 'imagen';
  return (
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 48) || 'imagen'
  );
}

function resolveExtension(file: File): string | null {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : '';
  const ext = (fromName || file.type.split('/')[1] || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return ALLOWED_EXTENSIONS.has(ext) ? ext : null;
}

export async function uploadImage(
  bucket: string,
  formData: FormData
): Promise<UploadResult> {
  try {
    await requireAdmin();
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return { success: false, error: 'Destino de almacenamiento no válido.' };
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
      return { success: false, error: 'Selecciona un archivo de imagen.' };
    }
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'El archivo debe ser una imagen.' };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: 'La imagen no debe superar los 5 MB.' };
    }
    const ext = resolveExtension(file);
    if (!ext) {
      return { success: false, error: 'Formato no permitido (jpg, png, webp, avif).' };
    }

    const supabase = await createClient();
    const path = `${Date.now()}-${sanitizeFileName(file.name)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('[storage] upload failed:', { bucket, path, message: error.message });
      return { success: false, error: 'No se pudo subir la imagen.' };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unexpected error' };
  }
}
