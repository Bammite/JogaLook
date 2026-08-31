const { supabaseAdmin } = require('../supabaseClient');

// ==============================================================================
// SERVICE STORAGE - Upload de fichiers vers Supabase Storage
// ==============================================================================

// Buckets Supabase utilisés par l'application.
// Vous devez les créer dans le dashboard Supabase : Storage -> New bucket
//  - jogalook-categories (public)
//  - jogalook-products   (public)
//  - jogalook-templates  (public)
//  - jogalook-misc       (public)
const BUCKETS = {
  categories: 'jogalook-categories',
  products: 'jogalook-products',
  templates: 'jogalook-templates',
  articles: 'jogalook-articles',
  misc: 'jogalook-misc',
};

// Cache pour stocker les buckets vérifiés/créés durant cette session
const verifiedBuckets = new Set();

// Extensions autorisées par type de bucket
const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/svg',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Génère un nom de fichier unique et sûr.
 * @param {string} originalName - nom original du fichier
 * @returns {string} chemin de fichier unique
 */
function generateFilePath(originalName) {
  const ext = (originalName.split('.').pop() || 'png').toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Valide un fichier envoyé (type + taille).
 * @param {Express.Multer.File} file
 */
function validateFile(file) {
  if (!file) {
    const err = new Error('Aucun fichier envoyé');
    err.code = 'NO_FILE';
    throw err;
  }
  if (file.size > MAX_FILE_SIZE) {
    const err = new Error('Fichier trop volumineux (max 5 Mo)');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    const err = new Error(`Type de fichier non autorisé : ${file.mimetype}`);
    err.code = 'INVALID_MIME';
    throw err;
  }
}

/**
 * Upload un fichier vers Supabase Storage et renvoie l'URL publique.
 *
 * @param {Express.Multer.File} file - fichier issu de multer (memoryStorage)
 * @param {keyof typeof BUCKETS} bucketKey - clé du bucket (categories, products…)
 * @param {string} [folder] - sous-dossier optionnel
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
async function uploadFile(file, bucketKey = 'misc', folder = '') {
  validateFile(file);

  const bucket = BUCKETS[bucketKey];
  if (!bucket) {
    const err = new Error(`Bucket inconnu : ${bucketKey}`);
    err.code = 'UNKNOWN_BUCKET';
    throw err;
  }

  // ── Assurer la présence du bucket sur Supabase (une fois par session) ──
  if (!verifiedBuckets.has(bucket)) {
    try {
      const { data: bucketsList, error: listError } = await supabaseAdmin.storage.listBuckets();
      if (!listError) {
        const exists = bucketsList?.some(b => b.name === bucket);
        if (!exists) {
          console.log(`[Storage] Tentative de création automatique du bucket public : ${bucket}`);
          const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: MAX_FILE_SIZE,
            allowedMimeTypes: ALLOWED_MIME
          });
          if (createError) {
            console.warn(`[Storage] Impossible de créer le bucket ${bucket}:`, createError.message);
          } else {
            console.log(`[Storage] Bucket créé avec succès : ${bucket}`);
            verifiedBuckets.add(bucket);
          }
        } else {
          verifiedBuckets.add(bucket);
        }
      }
    } catch (e) {
      console.warn(`[Storage] Échec de la vérification initiale du bucket ${bucket}:`, e.message);
    }
  }

  const fileName = generateFilePath(file.originalname);
  const fullPath = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${fileName}` : fileName;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fullPath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    const err = new Error(`Erreur upload Supabase: ${error.message}`);
    err.code = 'UPLOAD_FAILED';
    throw err;
  }

  // Récupération de l'URL publique
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fullPath);

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Supprime un fichier du Storage à partir de son chemin.
 * @param {string} path - chemin retourné lors de l'upload
 * @param {keyof typeof BUCKETS} bucketKey
 */
async function removeFile(path, bucketKey = 'misc') {
  const bucket = BUCKETS[bucketKey];
  if (!bucket) return;
  await supabaseAdmin.storage.from(bucket).remove([path]);
}

module.exports = {
  BUCKETS,
  uploadFile,
  removeFile,
  validateFile,
};