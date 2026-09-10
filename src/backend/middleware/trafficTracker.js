const { supabaseAdmin, isConfigured } = require('../supabaseClient');
const jwt = require('jsonwebtoken');

// Regex pour filtrer les fichiers statiques de assets/build et ressources externes
const STATIC_ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|webmanifest)$/i;

/**
 * Middleware pour enregistrer chaque visite / navigation sur le site dans la table site_visits.
 * Exécution 100% asynchrone (fire & forget) pour un impact nul sur le temps de réponse.
 */
function trafficTracker(req, res, next) {
  // Ignorer les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return next();
  }

  const reqPath = req.originalUrl || req.path || '/';

  // Ignorer les fichiers statiques
  if (STATIC_ASSET_REGEX.test(reqPath)) {
    return next();
  }

  // Extraire l'adresse IP du client (support des proxies Vercel / Cloudflare)
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const ip_address = String(rawIp).split(',')[0].trim().substring(0, 45) || null;

  // Extraire User-Agent et Referer
  const user_agent = req.headers['user-agent'] ? String(req.headers['user-agent']).substring(0, 500) : null;
  const referer = req.headers['referer'] || req.headers['referrer'] ? String(req.headers['referer'] || req.headers['referrer']).substring(0, 500) : null;

  // Tenter de récupérer l'ID utilisateur via token JWT
  let userId = req.user?.id || null;
  if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && (decoded.id || decoded.sub)) {
        userId = decoded.id || decoded.sub;
      }
    } catch (_) {
      // Ignore les erreurs de décodage
    }
  }

  // Insertion asynchrone non-bloquante dans la base de données
  if (isConfigured) {
    supabaseAdmin
      .from('site_visits')
      .insert([{
        path: reqPath,
        method: req.method,
        ip_address,
        user_agent,
        referer,
        user_id: userId
      }])
      .then(({ error }) => {
        if (error && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [TrafficTracker] Échec insertion visite :', error.message);
        }
      })
      .catch(() => {});
  }

  next();
}

module.exports = trafficTracker;
