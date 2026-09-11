const { supabaseAdmin, isConfigured } = require('../supabaseClient');
const jwt = require('jsonwebtoken');

// Regex pour filtrer les fichiers statiques
const STATIC_ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|webmanifest)$/i;

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (let c of cookies) {
    const [key, val] = c.trim().split('=');
    if (key === name && val) return val.trim();
  }
  return null;
}

/**
 * Middleware de suivi des visites et des sessions uniques.
 * Mémorise l'ID de session (cookie / header x-session-id) pour lier toutes les vues d'un même visiteur
 * jusqu'à la fermeture de son navigateur sans surcharger les statistiques.
 */
function trafficTracker(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const reqPath = req.originalUrl || req.path || '/';

  // Ignorer les fichiers statiques
  if (STATIC_ASSET_REGEX.test(reqPath)) {
    return next();
  }

  // 1. Récupération ou génération du session_id
  let sessionId = req.headers['x-session-id'] || parseCookie(req.headers.cookie, 'jl_sid');

  if (!sessionId) {
    sessionId = `sid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      res.cookie('jl_sid', sessionId, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/'
      });
    } catch (_) {}
  }

  // Extraire l'IP client (support proxies Vercel / Cloudflare)
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const ip_address = String(rawIp).split(',')[0].trim().substring(0, 45) || null;

  const user_agent = req.headers['user-agent'] ? String(req.headers['user-agent']).substring(0, 500) : null;
  const referer = req.headers['referer'] || req.headers['referrer'] ? String(req.headers['referer'] || req.headers['referrer']).substring(0, 500) : null;

  let userId = req.user?.id || null;
  if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && (decoded.id || decoded.sub || decoded.user_id)) {
        userId = decoded.user_id || decoded.id || decoded.sub;
      }
    } catch (_) {}
  }

  if (isConfigured) {
    supabaseAdmin
      .from('site_visits')
      .insert([{
        session_id: sessionId,
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
