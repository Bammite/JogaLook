// Charge les variables d'environnement au tout début de l'application
require('dotenv').config();

const app = require('./src/index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Serveur JogaLook démarré sur : http://localhost:${PORT}`);
  console.log(`📡 URL Supabase : ${process.env.SUPABASE_URL || 'Non configurée (voir .env)'}`);
  console.log(`==================================================`);
});