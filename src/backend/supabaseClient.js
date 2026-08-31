const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

if (!isConfigured) {
  console.warn('⚠️ ATTENTION: SUPABASE_URL ou les clés d\'API ne sont pas encore configurées dans le fichier .env');
}

// Client Supabase Public (pour opérations standards)
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Client Supabase Admin (Service Role - accès privilégié backend)
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false
    }
  }
);

module.exports = {
  supabase,
  supabaseAdmin,
  isConfigured
};
