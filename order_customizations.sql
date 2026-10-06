-- ==============================================================================
-- order_customizations.sql
-- Migration : Ajout des colonnes de personnalisation pour la table order_items
-- Permet de sauvegarder fidèlement le flocage (Face, Dos, Nom, Numéro, Badges)
-- ==============================================================================

-- 1. Ajout des colonnes de personnalisation sur order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS custom_details JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_front TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preview_back TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_number VARCHAR(10) DEFAULT NULL;

-- 2. Ajout des colonnes svg_front et svg_back sur customizations si manquantes
ALTER TABLE customizations
ADD COLUMN IF NOT EXISTS svg_front TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS svg_back TEXT DEFAULT NULL;

-- 3. Commentaire d'aide
COMMENT ON COLUMN order_items.custom_details IS 'Détails complets de personnalisation atelier (nom, numéro, police, couleurs, badges, config SVG)';
COMMENT ON COLUMN order_items.preview_front IS 'Image ou aperçu face avant du maillot';
COMMENT ON COLUMN order_items.preview_back IS 'Image ou aperçu face arrière (dos) du maillot';
