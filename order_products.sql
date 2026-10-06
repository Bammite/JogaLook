-- ==============================================================================
-- MIGRATION : GESTION DES SCORES DE MISE EN AVANT DES PRODUITS
-- ==============================================================================

-- 1. Ajouter la colonne display_order (score) à la table products
-- Score : plus il est élevé, plus le produit apparaît en tête du catalogue.
-- NULL ou 0 = pas de mise en avant prioritaire (tri automatique par prix croissant, puis date).
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS display_order INT DEFAULT NULL;

-- 2. Index pour optimiser les performances de tri (Score DESC, Prix ASC, Date DESC)
DROP INDEX IF EXISTS idx_products_display_order;
CREATE INDEX IF NOT EXISTS idx_products_display_order 
ON products (display_order DESC NULLS LAST, base_price ASC, created_at DESC);

