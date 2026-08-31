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

app.use(express.static(frontendPath));

// Middleware SPA : toute requête GET qui ne cible pas /api ou /service renvoie index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/service') && req.path !== '/test-paiement' && req.path !== '/test-paiement.html') {
    const indexPath = path.join(frontendPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// ==============================================================================
// 4. GESTIONNAIRES D'ERREURS & 404
// ==============================================================================
app.use((req, res) => {
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