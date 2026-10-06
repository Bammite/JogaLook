-- ==============================================================================
-- maj.sql — Migration : galerie d'images multi pour products & product_variants
-- Exécuter dans Supabase : Dashboard → SQL Editor → paste & Run
-- ==============================================================================


-- Statut d'activité des boutiques, indépendant de leur vérification.
ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Identifiant compact et partageable pour les liens produits.
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS short_code VARCHAR(12);

UPDATE public.products
SET short_code = SUBSTRING(REPLACE(id::TEXT, '-', ''), 1, 12)
WHERE short_code IS NULL OR short_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_short_code_unique
    ON public.products (short_code);

-- Paiement confirmé mais encaissé à la réception de la commande.
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'ON_DELIVERY';

-- ==============================================================================
-- 1. TABLE product_images
--    Remplace la colonne image_url unique sur products.
--    Chaque ligne est une image associée à un produit, avec un ordre d'affichage.
--    La colonne image_url de products est conservée comme image principale
--    pour rétrocompatibilité (= image à is_primary = true dans cette table).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS product_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Clé étrangère vers le produit propriétaire
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- URL publique Supabase Storage
    url             TEXT NOT NULL,

    -- Texte alternatif pour l'accessibilité et le SEO
    alt_text        VARCHAR(255),

    -- Ordre d'affichage dans la galerie (0 = première)
    position        SMALLINT NOT NULL DEFAULT 0,

    -- Indique l'image à utiliser comme miniature principale
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps standard
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour accélérer la récupération des images d'un produit triées par position
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
    ON product_images (product_id, position ASC);

-- Contrainte : un seul enregistrement is_primary = true par produit
-- (géré applicativement, mais ajout d'un index partiel utile)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_primary_unique
    ON product_images (product_id)
    WHERE is_primary = TRUE;


-- ==============================================================================
-- 2. TABLE variant_images
--    Galerie d'images spécifique à une variante (ex : la même couleur vue sous
--    plusieurs angles). Optionnel : si vide, on affiche les images du produit.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS variant_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Clé étrangère vers la variante
    variant_id      UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,

    url             TEXT NOT NULL,
    alt_text        VARCHAR(255),
    position        SMALLINT NOT NULL DEFAULT 0,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id
    ON variant_images (variant_id, position ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_images_primary_unique
    ON variant_images (variant_id)
    WHERE is_primary = TRUE;


-- ==============================================================================
-- 3. MIGRATION DES DONNÉES EXISTANTES
--    Pour chaque produit ayant déjà une image_url, on insère une ligne dans
--    product_images (is_primary = true, position = 0).
--    La colonne image_url sur products est gardée intacte pour rétrocompat.
-- ==============================================================================

INSERT INTO product_images (product_id, url, alt_text, position, is_primary)
SELECT
    id         AS product_id,
    image_url  AS url,
    name       AS alt_text,
    0          AS position,
    TRUE       AS is_primary
FROM products
WHERE image_url IS NOT NULL
  AND image_url <> ''
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- 4. COMMENTAIRES DOCUMANTAIRES
-- ==============================================================================

COMMENT ON TABLE product_images IS
    'Galerie d''images pour un produit. Une seule ligne peut avoir is_primary = true par produit.';

COMMENT ON COLUMN product_images.position IS
    'Ordre d''affichage dans la galerie, 0 = première image.';

COMMENT ON COLUMN product_images.is_primary IS
    'Image principale affichée en miniature dans les cartes produit et en première dans la galerie.';

COMMENT ON TABLE variant_images IS
    'Images spécifiques à une variante (ex : couleur vue de face/dos). Facultatif : si vide, la galerie du produit parent est utilisée.';


-- ==============================================================================
-- 5. RLS (Row Level Security) — Supabase
--    Les images sont publiques en lecture.
--    L'écriture est réservée aux rôles service_role (backend admin).
-- ==============================================================================

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "product_images_select_public"
    ON product_images FOR SELECT
    USING (TRUE);

CREATE POLICY "variant_images_select_public"
    ON variant_images FOR SELECT
    USING (TRUE);

-- Écriture service_role uniquement (backend Node.js avec SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "product_images_write_service"
    ON product_images FOR ALL
    USING     (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "variant_images_write_service"
    ON variant_images FOR ALL
    USING     (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ==============================================================================
-- 0. EXTENSIONS REQUISES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- 1. TABLE keywords
--    Répertoire de mots-clés utilisés pour la recherche sémantique /
--    typologie de produits.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS keywords (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    word            VARCHAR(100) NOT NULL,
    lang            VARCHAR(5) DEFAULT 'fr',
    usage_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unicité du mot-clé par langue
CREATE UNIQUE INDEX IF NOT EXISTS idx_keywords_word_lang
    ON keywords (LOWER(word), lang);

-- Index pour la recherche par préfixe / autocomplete (nécessite pg_trgm)
CREATE INDEX IF NOT EXISTS idx_keywords_word_trgm
    ON keywords USING gin (word gin_trgm_ops);

-- Fallback 
CREATE INDEX IF NOT EXISTS idx_keywords_word_lower
    ON keywords (LOWER(word));


-- ==============================================================================
-- 2. TABLE product_keyword_similarity
--    Table de jonction products ↔ keywords avec un score d'équivalence
-- ==============================================================================
CREATE TABLE IF NOT EXISTS product_keyword_similarity (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    keyword_id      UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    similarity      SMALLINT NOT NULL DEFAULT 0 CHECK (similarity >= 0 AND similarity <= 100),
    source          VARCHAR(30) NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Un seul score par paire produit / mot-clé
CREATE UNIQUE INDEX IF NOT EXISTS idx_pks_product_keyword
    ON product_keyword_similarity (product_id, keyword_id);

-- Recherche : trouver les produits les plus pertinents pour un mot-clé
CREATE INDEX IF NOT EXISTS idx_pks_keyword_similarity
    ON product_keyword_similarity (keyword_id, similarity DESC);

-- Recherche : trouver les mots-clés les plus associés à un produit
CREATE INDEX IF NOT EXISTS idx_pks_product_similarity
    ON product_keyword_similarity (product_id, similarity DESC);


-- ==============================================================================
-- 3. COMMENTAIRES
-- ==============================================================================
COMMENT ON TABLE keywords IS 'Répertoire de mots-clés pour la recherche sémantique et le matching produits.';
COMMENT ON COLUMN keywords.word IS 'Mot-clé normalisé en minuscules, trimé. Unique par langue.';
COMMENT ON COLUMN keywords.usage_count IS 'Compteur d''utilisation / recherche du mot-clé, incrémenté côté application.';
COMMENT ON TABLE product_keyword_similarity IS 'Score d''équivalence (0-100) entre un mot-clé et un produit. Utilisé pour la recherche et les suggestions.';
COMMENT ON COLUMN product_keyword_similarity.similarity IS 'Pourcentage de pertinence : 0 = aucune relation, 100 = correspondance parfaite.';
COMMENT ON COLUMN product_keyword_similarity.source IS 'Origine du score : manual (admin), auto (algorithme), import, etc.';


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_keyword_similarity ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "keywords_select_public"
    ON keywords FOR SELECT USING (TRUE);

CREATE POLICY "product_keyword_similarity_select_public"
    ON product_keyword_similarity FOR SELECT USING (TRUE);

-- Écriture service_role uniquement
CREATE POLICY "keywords_write_service"
    ON keywords FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "product_keyword_similarity_write_service"
    ON product_keyword_similarity FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');


-- ==============================================================================
-- 5. MIGRATION TEMPLATES SVG (Face, Dos, Blason, Éléments Modifiables)
-- ==============================================================================

ALTER TABLE templates ADD COLUMN IF NOT EXISTS svg_front TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS svg_back TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS badge_url TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS badge_svg TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS editable_elements JSONB DEFAULT '{"body": true, "collar": true, "sleeves": true, "stripes": true, "badge": true, "name_zone": true, "number_zone": true}'::jsonb;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS layers_config JSONB DEFAULT '{"body_id": "jersey-body", "collar_id": "jersey-collar", "sleeves_id": "jersey-sleeves", "stripes_id": "jersey-stripes", "badge_zone_id": "badge-zone", "name_zone_id": "name-zone", "number_zone_id": "number-zone"}'::jsonb;

-- Remplir svg_front avec svg_content pour les templates existants si svg_front est vide
UPDATE templates SET svg_front = svg_content WHERE svg_front IS NULL AND svg_content IS NOT NULL;


-- ==============================================================================
-- 6. MIGRATION TABLE CUSTOMIZATIONS (Sauvegarde des personnalisations)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    title VARCHAR(150),
    svg_content TEXT NOT NULL,
    svg_front TEXT,
    svg_back TEXT,
    preview_image_url TEXT,
    custom_name VARCHAR(100),
    custom_number VARCHAR(10),
    font_family VARCHAR(100),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    price DECIMAL(12, 2) DEFAULT 0.00,
    size VARCHAR(20),
    quantity INT DEFAULT 1,
    extra_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE customizations ADD COLUMN IF NOT EXISTS svg_front TEXT;
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS svg_back TEXT;
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS price DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS size VARCHAR(20);
ALTER TABLE customizations ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE customizations ALTER COLUMN user_id DROP NOT NULL;


-- ==============================================================================
-- 7. MIGRATION TEMPLATES MOCKUP / PHOTO RÉALISTE + FLOCKAGE DYNAMIQUE
-- ==============================================================================

-- Type de template : 'SVG' (personnalisation vectorielle intégrale) ou 'MOCKUP' (photo HD + flockage)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) DEFAULT 'SVG';

-- Photos haute résolution du maillot (Face et Dos vierge sans nom ni numéro)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS image_front TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS image_back TEXT;

-- Configuration du positionnement du flockage (hauteur en %, police, couleur)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS flocking_config JSONB DEFAULT '{
  "name": {
    "y_percent": 28,
    "font_family": "Impact",
    "font_size": 28,
    "default_color": "#ffffff",
    "letter_spacing": 4
  },
  "number": {
    "y_percent": 55,
    "font_family": "Impact",
    "font_size": 110,
    "default_color": "#ffffff"
  },
  "allowed_colors": ["#ffffff", "#111111", "#ffd700", "#e63946", "#1d3557"]
}'::jsonb;

-- Fichier : order_products.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Espace boutiquier : retrouver rapidement la boutique du propriétaire
CREATE INDEX IF NOT EXISTS idx_shops_owner_id
    ON public.shops(owner_id);

-- Espace boutiquier : retrouver les commandes contenant les variantes de ses produits
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id
    ON public.order_items(product_variant_id);
