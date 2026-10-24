const WEBP_QUALITY = 0.82;
const MAX_DIMENSION = 1600;

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

/**
 * Convierte una imagen a WebP comprimido en el navegador.
 * Redimensiona si supera MAX_DIMENSION y aplica calidad 0.82.
 * Si el navegador no soporta WebP encoding, devuelve el archivo original.
 */
export async function compressToWebp(file: File): Promise<CompressResult> {
  const originalSize = file.size;

  // Si ya es WebP y pesa menos de 300KB, dejarlo así
  if (file.type === 'image/webp' && file.size < 300 * 1024) {
    return { file, originalSize, compressedSize: originalSize };
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    // Redimensionar si es muy grande
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return { file, originalSize, compressedSize: originalSize };
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY);
    });

    // Si el navegador no soporta WebP encoding, devolver original
    if (!blob || blob.size === 0) {
      return { file, originalSize, compressedSize: originalSize };
    }

    const ext = 'webp';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const compressed = new File([blob], `${baseName}.${ext}`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
    };
  } catch {
    // Si falla la conversión, subir el original
    return { file, originalSize, compressedSize: originalSize };
  }
}
