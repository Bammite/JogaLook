const { Pool } = require('pg');
const dotenv = require('dotenv');

// Chargement optionnel des variables d'environnement en dev
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. See .env.example');
}

// Configure a secure connection pool suitable for production with Supabase
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.PG_POOL_MAX, 10) || 20,
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT_MS, 10) || 2000,
  ssl: process.env.PGSSLMODE === 'no-verify' ? { rejectUnauthorized: false } : { rejectUnauthorized: true }
});

// Helper for parameterized queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Optionally log slow queries in production
  if (process.env.NODE_ENV === 'development' || (process.env.LOG_SLOW_QUERIES === 'true' && duration > 200)) {
    console.log('PG QUERY', { text, duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { pool, query };
