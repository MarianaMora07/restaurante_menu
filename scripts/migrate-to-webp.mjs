/**
 * Migra todas las imágenes de Supabase Storage a WebP.
 *
 * Uso:
 *   node scripts/migrate-to-webp.mjs
 *
 * Requiere en .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Opcional:
 *   DELETE_ORIGINALS=true  (borra los archivos originales después de migrar)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DELETE_ORIGINALS = process.env.DELETE_ORIGINALS === 'true';
const WEBP_QUALITY = 82;
const MAX_DIMENSION = 1600;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BUCKETS = ['dishes-images', 'promos-images', 'menu-templates'];

function extractPathFromUrl(url) {
  // URL formato: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) return null;
  const bucket = rest.slice(0, slashIdx);
  const path = rest.slice(slashIdx + 1);
  return { bucket, path };
}

async function convertBufferToWebp(buffer) {
  const resized = sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY });
  return resized.toBuffer();
}

async function listAllFiles(bucket) {
  const { data, error } = await supabase.storage.from(bucket).list('', {
    limit: 1000,
    offset: 0,
  });
  if (error) {
    console.error(`Error listando ${bucket}:`, error.message);
    return [];
  }
  // Solo archivos (no carpetas)
  return (data ?? []).filter((f) => f.id !== null).map((f) => f.name);
}

async function migrateBucket(bucket) {
  console.log(`\n📦 Bucket: ${bucket}`);
  const files = await listAllFiles(bucket);
  console.log(`   ${files.length} archivo(s) encontrado(s)`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const fileName of files) {
    // Ya es WebP, saltar
    if (fileName.toLowerCase().endsWith('.webp')) {
      skipped++;
      continue;
    }

    try {
      // 1. Descargar
      const { data: fileData, error: dlError } = await supabase.storage
        .from(bucket)
        .download(fileName);
      if (dlError || !fileData) {
        console.error(`   ❌ ${fileName}: error descargando — ${dlError?.message}`);
        failed++;
        continue;
      }

      const originalBuffer = Buffer.from(await fileData.arrayBuffer());
      const originalKB = Math.round(originalBuffer.length / 1024);

      // 2. Convertir a WebP
      const webpBuffer = await convertBufferToWebp(originalBuffer);
      const webpKB = Math.round(webpBuffer.length / 1024);

      // 3. Nombre nuevo
      const baseName = fileName.replace(/\.[^.]+$/, '');
      const newFileName = `${baseName}.webp`;

      // 4. Subir WebP
      const { error: upError } = await supabase.storage
        .from(bucket)
        .upload(newFileName, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });
      if (upError) {
        console.error(`   ❌ ${fileName}: error subiendo WebP — ${upError.message}`);
        failed++;
        continue;
      }

      const savings = originalKB > 0 ? Math.round((1 - webpKB / originalKB) * 100) : 0;
      console.log(`   ✅ ${fileName} → ${newFileName}  (${originalKB}KB → ${webpKB}KB, -${savings}%)`);

      // 5. Actualizar referencias en BD
      await updateDbReferences(bucket, fileName, newFileName);

      // 6. Borrar original si se pidió
      if (DELETE_ORIGINALS) {
        await supabase.storage.from(bucket).remove([fileName]);
      }

      migrated++;
    } catch (err) {
      console.error(`   ❌ ${fileName}: ${err.message}`);
      failed++;
    }
  }

  return { migrated, skipped, failed };
}

async function updateDbReferences(bucket, oldName, newName) {
  const oldSuffix = `/${bucket}/${oldName}`;
  const newUrlPath = `/storage/v1/object/public/${bucket}/${newName}`;

  // URLs completas para reemplazo
  // Buscar en dishes.image_url
  if (bucket === 'dishes-images') {
    const { data: dishes } = await supabase
      .from('dishes')
      .select('id, image_url')
      .like('image_url', `%/${oldName}`);
    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        const newUrl = `${SUPABASE_URL}${newUrlPath}`;
        await supabase.from('dishes').update({ image_url: newUrl }).eq('id', dish.id);
        console.log(`      ↳ dishes.${dish.id} actualizado`);
      }
    }
  }

  if (bucket === 'promos-images') {
    const { data: promos } = await supabase
      .from('promos')
      .select('id, image_url')
      .like('image_url', `%/${oldName}`);
    if (promos && promos.length > 0) {
      for (const promo of promos) {
        const newUrl = `${SUPABASE_URL}${newUrlPath}`;
        await supabase.from('promos').update({ image_url: newUrl }).eq('id', promo.id);
        console.log(`      ↳ promos.${promo.id} actualizado`);
      }
    }
  }

  if (bucket === 'menu-templates') {
    const { data: setting } = await supabase
      .from('app_settings')
      .select('key, value')
      .eq('key', 'menu_template_url')
      .maybeSingle();
    if (setting && setting.value && setting.value.includes(oldName)) {
      const newUrl = `${SUPABASE_URL}${newUrlPath}`;
      await supabase.from('app_settings').update({ value: newUrl }).eq('key', 'menu_template_url');
      console.log(`      ↳ app_settings.menu_template_url actualizado`);
    }
  }

  void oldSuffix;
}

// Detectar project ref para URLs
async function getProjectRef() {
  const { data } = await supabase.storage.listBuckets();
  void data;
  return SUPABASE_URL.split('//')[1]?.split('.')[0] ?? '';
}

async function main() {
  console.log('🔄 Migración de imágenes a WebP');
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   Borrar originales: ${DELETE_ORIGINALS ? 'SÍ' : 'no'}`);
  console.log(`   Calidad: ${WEBP_QUALITY}% | Max: ${MAX_DIMENSION}px`);

  await getProjectRef();

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const bucket of BUCKETS) {
    const result = await migrateBucket(bucket);
    totalMigrated += result.migrated;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log('\n📊 Resumen:');
  console.log(`   Migradas: ${totalMigrated}`);
  console.log(`   Ya eran WebP: ${totalSkipped}`);
  console.log(`   Fallidas: ${totalFailed}`);

  if (!DELETE_ORIGINALS && totalMigrated > 0) {
    console.log('\n💡 Para borrar los originales, ejecuta de nuevo con:');
    console.log('   DELETE_ORIGINALS=true node scripts/migrate-to-webp.mjs');
  }
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
