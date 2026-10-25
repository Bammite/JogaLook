const express = require('express');
const path = require('path');

const app = express();

// ==============================================================================
// 1. MIDDLEWARES DE BASE
// ==============================================================================

// Body parsers avec limite augmentée pour accepter le stockage de grands SVG
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gestion du CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Suivi automatique du trafic et des visites sur tout le site (non-bloquant)
const trafficTracker = require('./backend/middleware/trafficTracker');
app.use(trafficTracker);

// ==============================================================================
// 2. ROUTES API BACKEND (SUPABASE & CRUD)
// ==============================================================================
app.use('/api', require('./backend'));

// Service auxiliaire si présent
try {
  app.use('/service', require('./serviceAuxiliaire')); 
} catch (e) {
  // Service optionnel
}

// ==============================================================================
// ==============================================================================
// 3. SERVICE DE L'APPLICATION FRONTEND REACT (SPA)
// ==============================================================================
const frontendPath = path.join(__dirname, 'frontend');

// Page de test autonome HTML (isolée de React)
app.get(['/test-paiement', '/test-paiement.html'], (req, res) => {
  res.sendFile(path.join(frontendPath, 'test-paiement.html'));
});

app.get(['/test-service', '/test-service.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'serviceAuxiliaire', 'testService.html'));
});

app.get(['/404', '/404.html'], (req, res) => {
  res.status(404).sendFile(path.join(frontendPath, '404.html'));
});

// Fichiers statiques frontend (assets, css, js, favicon, legal/*.html, 404.html).
// index.html doit toujours être revalidé ; les assets Vite hashés peuvent être
// conservés longtemps puisqu'un nouveau nom est généré à chaque build.
app.use(express.static(frontendPath, {
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// Middleware SPA : toute requête GET qui ne cible pas /api ou /service renvoie index.html (géré ensuite par React Router)
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/service') &&
    req.path !== '/test-paiement' &&
    req.path !== '/test-paiement.html' &&
    req.path !== '/404' &&
    req.path !== '/404.html'
  ) {
    // Une requête qui ressemble à un fichier statique ne doit jamais recevoir
    // index.html : cela provoquerait une erreur MIME pour les modules JS.
    if (path.extname(req.path)) return next();

    const indexPath = path.join(frontendPath, 'index.html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// ==============================================================================
// 4. GESTIONNAIRES D'ERREURS & 404 (pour API ou requêtes non traitées)
// ==============================================================================
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(frontendPath, '404.html'));
  }
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`
  });
});

// Middleware d'erreur globale
app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur globale:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
