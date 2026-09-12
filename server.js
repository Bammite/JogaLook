// Charge les variables d'environnement au tout début de l'application
require('dotenv').config();

const app = require('./src/index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Serveur JogaLook démarré sur : http://localhost:${PORT}`);
  console.log(`📡 URL Supabase : ${process.env.SUPABASE_URL || 'Non configurée (voir .env)'}`);
  console.log(`==================================================`);

  // ── Keep-alive Supabase (Free Tier) ────────────────────────────────────────
  // Le plan gratuit Supabase met le projet en veille après ~10 min d'inactivité.
  // Ce ping toutes les 9 min maintient la connexion active et évite les timeouts.
  const { supabaseAdmin } = require('./src/backend/supabaseClient');
  const PING_INTERVAL_MS = 9 * 60 * 1000; // 9 minutes

  const keepAlive = async () => {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true });
      if (error) {
        console.warn('⚠️  Keep-alive Supabase: erreur mineure -', error.message);
      } else {
        console.log(`💓 Keep-alive Supabase OK [${new Date().toISOString()}]`);
      }
    } catch (err) {
      console.warn('⚠️  Keep-alive Supabase: connexion échouée -', err.message);
    }
  };

  // Premier ping au démarrage (réveille immédiatement Supabase si endormi)
  keepAlive();
  // Puis toutes les 9 minutes
  setInterval(keepAlive, PING_INTERVAL_MS);
});