-- ==============================================================================
-- MIGRATION : GROUPES DE CATÉGORIES (NAVIGATION E-COMMERCE)
-- ==============================================================================

-- 1. Table des groupes de catégories (ex: Vêtements, Sport, Électronique...)
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    display_order INT DEFAULT 0,
    show_in_navbar BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Compatible avec une table déjà créée avant l'ajout de cette option.
ALTER TABLE category_groups
  ADD COLUMN IF NOT EXISTS show_in_navbar BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Table de liaison entre groupes et catégories (plusieurs catégories par groupe)
CREATE TABLE IF NOT EXISTS category_group_items (
    group_id UUID NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    position INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, category_id)
);

-- 3. Index pour la performance
CREATE INDEX IF NOT EXISTS idx_category_groups_display_order ON category_groups (display_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_category_group_items_group_id ON category_group_items (group_id);
CREATE INDEX IF NOT EXISTS idx_category_group_items_category_id ON category_group_items (category_id);

-- 4. Données par défaut pré-remplies : Vêtements, Sport, Électronique
INSERT INTO category_groups (name, slug, description, display_order)
VALUES 
    ('Vêtements', 'vetements', 'Tous les vêtements, tenues et accessoires de mode.', 1),
    ('Sport', 'sport', 'Équipements, tenues et articles de sport.', 2),
    ('Électronique', 'electronique', 'Gadgets, montres connectées et accessoires électroniques.', 3)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
