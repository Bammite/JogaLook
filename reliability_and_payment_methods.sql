-- ==============================================================================
-- Migration : Table de Fiabilité (Paiement à la livraison) & Méthodes Sauvegardées
-- Exécuter dans Supabase : Dashboard -> SQL Editor -> Coller & Run
-- ==============================================================================

-- 1. Table de fiabilité utilisateur (Contrôle du Paiement à la Livraison / COD)
CREATE TABLE IF NOT EXISTS user_reliability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(30),
    is_reliable BOOLEAN NOT NULL DEFAULT TRUE,          -- Utilisateur fiable ?
    cod_allowed BOOLEAN NOT NULL DEFAULT TRUE,          -- Paiement à la livraison autorisé ?
    failed_deliveries_count INT NOT NULL DEFAULT 0,     -- Nombre de refus / échecs de livraison
    successful_deliveries_count INT NOT NULL DEFAULT 0, -- Nombre de livraisons réussies
    trust_score INT NOT NULL DEFAULT 100,               -- Score de confiance (0 - 100)
    notes TEXT,                                         -- Motifs ou remarques admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_reliability_user_id ON user_reliability(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reliability_phone ON user_reliability(phone);

-- 2. Table des méthodes de paiement enregistrées par utilisateur (Pour les prochains achats)
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'wave', 'orange_money', 'free_money', 'mtn', 'moov', 'card', 'cash_on_delivery'
    phone_number VARCHAR(30),
    customer_name VARCHAR(150),
    country VARCHAR(10) DEFAULT 'sn',
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_method_phone UNIQUE(user_id, payment_method, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods(user_id);
