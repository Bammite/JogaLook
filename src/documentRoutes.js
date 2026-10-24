const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dossier de stockage des uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Conserver le nom original proprement encodé avec un préfixe timestamp unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Remplacer les caractères risqués mais garder l'extension
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_');
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  }
});

// Limite de taille par fichier (ex: 200MB) sans restriction de type MIME
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
});

// GET /upload -> page HTML d'upload
router.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'upload.html'));
});

// POST /upload -> réception des fichiers
router.post('/upload', upload.array('files', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    const uploaded = req.files.map(f => ({
      originalName: f.originalname,
      storedName: f.filename,
      size: f.size
    }));

    return res.json({
      success: true,
      message: `${uploaded.length} fichier(s) uploadé(s) avec succès`,
      uploadedFiles: uploaded
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /get -> page HTML listant les documents
router.get('/get', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'get.html'));
});

// GET /api/documents -> liste JSON des fichiers dans uploads
router.get('/api/documents', (req, res) => {
  try {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Impossible de lire le dossier uploads' });
      }

      const fileList = files
        .filter(filename => !filename.startsWith('.'))
        .map(filename => {
          const filePath = path.join(uploadsDir, filename);
          try {
            const stats = fs.statSync(filePath);
            if (!stats.isFile()) return null;

            // Extraire le nom d'origine sans le préfixe timestamp s'il existe
            // format: timestamp-random-baseName.ext
            let originalName = filename;
            const match = filename.match(/^\d+-\d+-(.+)$/);
            if (match && match[1]) {
              originalName = match[1];
            }

            return {
              storedName: filename,
              originalName: originalName,
              size: stats.size,
              createdAt: stats.birthtime || stats.mtime
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({ success: true, files: fileList });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /get/download/:filename -> Téléchargement forcé d'un fichier
router.get('/get/download/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fichier introuvable');
  }

  let downloadName = safeFilename;
  const match = safeFilename.match(/^\d+-\d+-(.+)$/);
  if (match && match[1]) {
    downloadName = match[1];
  }

  res.download(filePath, downloadName);
});

// GET /get/view/:filename -> Visualisation en direct dans le navigateur (image, PDF, etc.)
router.get('/get/view/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Fichier introuvable');
  }

  res.sendFile(filePath);
});

module.exports = router;
