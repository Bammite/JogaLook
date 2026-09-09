require('dotenv').config();
const { supabaseAdmin } = require('../supabaseClient');
const { BUCKETS } = require('../services/storageService');

const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
  'image/svg',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

async function syncAllBuckets() {
  console.log('🔄 Synchronisation des buckets Supabase Storage...');

  for (const [key, bucketName] of Object.entries(BUCKETS)) {
    try {
      console.log(`\n📦 Bucket [${key}] : "${bucketName}"`);
      const { data, error } = await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME,
      });

      if (error) {
        console.warn(`  ⚠️ Échec updateBucket: ${error.message}`);
        console.log(`  Tentative de création si inexistant...`);
        const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_MIME,
        });
        if (createErr) {
          console.error(`  ❌ Erreur createBucket: ${createErr.message}`);
        } else {
          console.log(`  ✅ Bucket créé avec succès !`);
        }
      } else {
        console.log(`  ✅ Types MIME mis à jour avec succès (AVIF, WebP, PNG, JPG, SVG autorisés).`);
      }
    } catch (err) {
      console.error(`  ❌ Erreur inattendue pour ${bucketName}:`, err.message);
    }
  }

  console.log('\n✨ Opération terminée.');
  process.exit(0);
}

syncAllBuckets();
