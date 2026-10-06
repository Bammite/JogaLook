-- ==============================================================================
-- Migration : Table userinfo (Dernières informations de livraison & paiement)
-- Exécuter dans Supabase : Dashboard -> SQL Editor -> Coller & Run
-- ==============================================================================

-- 1. Création de la table userinfo
CREATE TABLE IF NOT EXISTS userinfo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(150),
    phone_number VARCHAR(50),
    city VARCHAR(100) DEFAULT 'Dakar',
    delivery_type VARCHAR(50) DEFAULT 'manual', -- 'gps', 'manual', 'phone_call', 'pickup'
    delivery_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    payment_method VARCHAR(50), -- 'wave', 'orange_money', 'free_money', 'cash_on_delivery', 'card', etc.
    country VARCHAR(10) DEFAULT 'sn',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Si la table existe déjà, ajout sécurisé des nouvelles colonnes de géolocalisation
ALTER TABLE userinfo ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Dakar';
ALTER TABLE userinfo ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'manual';
ALTER TABLE userinfo ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE userinfo ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Index pour recherche ultra-rapide par utilisateur
CREATE INDEX IF NOT EXISTS idx_userinfo_user_id ON userinfo(user_id);

-- 3. Sécurité Row Level Security (RLS)
ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access on userinfo" ON userinfo
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own userinfo" ON userinfo
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own userinfo" ON userinfo
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
