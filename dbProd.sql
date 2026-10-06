-- ==============================================================================
-- SCHÉMA DE BASE DE DONNÉES DE PRODUCTION - JOGALOOK (SUPABASE)
-- ==============================================================================
-- Instructions d'exécution :
-- 1. Rendez-vous sur votre projet Supabase de Production.
-- 2. Ouvrez : SQL Editor -> New Query.
-- 3. Collez l'intégralité de ce script et cliquez sur "Run".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS POSTGRESQL
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TYPES ÉNUMÉRÉS (ENUMS)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SHOP_OWNER', 'DELIVERER', 'ADMIN', 'SUPER_ADMIN');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_visibility') THEN
        CREATE TYPE template_visibility AS ENUM ('PUBLIC', 'PRIVATE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'ON_DELIVERY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE delivery_status AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otp_purpose') THEN
        CREATE TYPE otp_purpose AS ENUM ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'ORDER_CONFIRMATION');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sports_article_status') THEN
        CREATE TYPE sports_article_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. UTILISATEURS, ADMINISTRATEURS & ADRESSES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    status user_status NOT NULL DEFAULT 'PENDING',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '[]'::jsonb,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_region VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'Sénégal',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 3. BOUTIQUES, FOURNISSEURS & CATÉGORIES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    is_affiliated BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 4. TEMPLATES SVG & CONFIGURATION ATELIER (CRÉÉ AVANT LES PRODUITS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    svg_content TEXT NOT NULL,
    svg_front TEXT,
    svg_back TEXT,
    badge_url TEXT,
    badge_svg TEXT,
    thumbnail_url TEXT,
    image_front TEXT,
    image_back TEXT,
    template_type VARCHAR(50) DEFAULT 'SVG',
    editable_elements JSONB DEFAULT '{"body": true, "collar": true, "sleeves": true, "stripes": true, "badge": true, "name_zone": true, "number_zone": true}'::jsonb,
    layers_config JSONB DEFAULT '{"body_id": "jersey-body", "collar_id": "jersey-collar", "sleeves_id": "jersey-sleeves", "stripes_id": "jersey-stripes", "badge_zone_id": "badge-zone", "name_zone_id": "name-zone", "number_zone_id": "number-zone"}'::jsonb,
    flocking_config JSONB DEFAULT '{"name": {"font_size": 28, "y_percent": 28, "font_family": "Impact", "default_color": "#ffffff", "letter_spacing": 4}, "number": {"font_size": 110, "y_percent": 55, "font_family": "Impact", "default_color": "#ffffff"}, "allowed_colors": ["#ffffff", "#111111", "#ffd700", "#e63946", "#1d3557"]}'::jsonb,
    visibility template_visibility NOT NULL DEFAULT 'PUBLIC',
    is_free BOOLEAN DEFAULT TRUE,
    price DECIMAL(12, 2) DEFAULT 0.00,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 5. PRODUITS, VARIANTES & IMAGES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    is_customizable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    size VARCHAR(20),
    color_name VARCHAR(50),
    color_hex VARCHAR(10),
    stock_quantity INT NOT NULL DEFAULT 0,
    price_override DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position SMALLINT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. PERSONNALISATIONS (CRÉATIONS CLIENTS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
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
    extra_config JSONB,
    price DECIMAL(12, 2) DEFAULT 0.00,
    size VARCHAR(20),
    quantity INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 7. PANIERS & COMMANDES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    customization_id UUID REFERENCES public.customizations(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'PENDING',
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    customization_id UUID REFERENCES public.customizations(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_info VARCHAR(150),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    -- Champs étendus indispensables pour l'atelier de flocage et la personnalisation
    custom_details JSONB DEFAULT NULL,
    preview_front TEXT DEFAULT NULL,
    preview_back TEXT DEFAULT NULL,
    custom_name VARCHAR(100) DEFAULT NULL,
    custom_number VARCHAR(10) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255) UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    deliverer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100) UNIQUE,
    status delivery_status NOT NULL DEFAULT 'PENDING',
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivered_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. GESTION UTILISATEUR AVANCÉE, LIVRAISON & PAIEMENT (MIGRATIONS CONSOLIDÉES)
-- ------------------------------------------------------------------------------

-- Dernière adresse, géolocalisation et préférences de livraison
CREATE TABLE IF NOT EXISTS public.userinfo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    customer_name VARCHAR(150),
    phone_number VARCHAR(50),
    delivery_address TEXT,
    city VARCHAR(100) DEFAULT 'Dakar',
    delivery_type VARCHAR(50) DEFAULT 'manual', -- 'gps', 'manual', 'phone_call', 'pickup'
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    payment_method VARCHAR(50),
    country VARCHAR(10) DEFAULT 'sn',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fiabilité client pour l'éligibilité au Paiement à la Livraison (COD)
CREATE TABLE IF NOT EXISTS public.user_reliability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    phone VARCHAR(30),
    is_reliable BOOLEAN NOT NULL DEFAULT TRUE,
    cod_allowed BOOLEAN NOT NULL DEFAULT TRUE,
    failed_deliveries_count INT NOT NULL DEFAULT 0,
    successful_deliveries_count INT NOT NULL DEFAULT 0,
    trust_score INT NOT NULL DEFAULT 100,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Méthodes de paiement favorites pré-enregistrées
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- 'wave', 'orange_money', 'free_money', etc.
    phone_number VARCHAR(30),
    customer_name VARCHAR(150),
    country VARCHAR(10) DEFAULT 'sn',
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_method_phone UNIQUE(user_id, payment_method, phone_number)
);

-- ------------------------------------------------------------------------------
-- 9. LOGS, SÉCURITÉ & CODES OTP
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    purpose otp_purpose NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email_attempted VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    previous_status order_status,
    new_status order_status NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.reservation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    status reservation_status NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. RECHERCHE & MOTS-CLÉS (MOTEUR DE RECHERCHE INTELLIGENT)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL,
    lang VARCHAR(10) DEFAULT 'fr',
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.product_keyword_similarity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
    similarity SMALLINT NOT NULL DEFAULT 0 CHECK (similarity >= 0 AND similarity <= 100),
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 11. ACTUALITÉS SPORTIVES & BLOG JOGALOOK
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sports_news_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.sports_news_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.sports_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.sports_news_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    status sports_article_status NOT NULL DEFAULT 'DRAFT',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INT NOT NULL DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.sports_article_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES public.sports_articles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sports_article_tags (
    article_id UUID NOT NULL REFERENCES public.sports_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.sports_news_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.sports_article_products (
    article_id UUID NOT NULL REFERENCES public.sports_articles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 12. INDEX DE PERFORMANCE CRITIQUES POUR LA PRODUCTION
-- ------------------------------------------------------------------------------

-- Auth & Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
CREATE INDEX IF NOT EXISTS idx_otps_recipient ON public.otps(recipient);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON public.login_logs(user_id);

-- Produits & Catalogue
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_shop ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_templates_owner ON public.templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_customizations_user ON public.customizations(user_id);

-- Commandes & Paiements
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order ON public.order_logs(order_id);

-- Infos utilisateurs & Paiements favoris
CREATE INDEX IF NOT EXISTS idx_userinfo_user_id ON public.userinfo(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reliability_user_id ON public.user_reliability(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reliability_phone ON public.user_reliability(phone);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON public.user_payment_methods(user_id);

-- Moteur de recherche
CREATE INDEX IF NOT EXISTS idx_keywords_word ON public.keywords(word);
CREATE INDEX IF NOT EXISTS idx_similarity_product ON public.product_keyword_similarity(product_id);
CREATE INDEX IF NOT EXISTS idx_similarity_keyword ON public.product_keyword_similarity(keyword_id);

-- Actualités & Blog
CREATE INDEX IF NOT EXISTS idx_sports_articles_slug ON public.sports_articles(slug);
CREATE INDEX IF NOT EXISTS idx_sports_articles_category ON public.sports_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_sports_articles_status_date ON public.sports_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_sports_news_categories_slug ON public.sports_news_categories(slug);

-- ------------------------------------------------------------------------------
-- 13. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.userinfo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reliability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_article_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sports_categories_select_public') THEN
        CREATE POLICY "sports_categories_select_public" ON public.sports_news_categories FOR SELECT USING (TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sports_articles_select_public') THEN
        CREATE POLICY "sports_articles_select_public" ON public.sports_articles FOR SELECT USING (status = 'PUBLISHED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sports_tags_select_public') THEN
        CREATE POLICY "sports_tags_select_public" ON public.sports_news_tags FOR SELECT USING (TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sports_article_tags_select_public') THEN
        CREATE POLICY "sports_article_tags_select_public" ON public.sports_article_tags FOR SELECT USING (TRUE);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 14. DONNÉES INITIALES DU BLOG (CATÉGORIES ET ARTICLES OFFICIELS)
-- ------------------------------------------------------------------------------
INSERT INTO public.sports_news_categories (id, name, slug, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Football Sénégalais & CAN', 'football-senegalais-can', 'Actualités des Lions de la Téranga, Ligue 1 sénégalaise et compétitions africaines.'),
    ('22222222-2222-2222-2222-222222222222', 'Football International', 'football-international', 'UEFA Champions League, Premier League, Liga, Serie A et grandes compétitions mondiales.'),
    ('33333333-3333-3333-3333-333333333333', 'Mercato & Transferts', 'mercato-transferts', 'Toutes les rumeurs officielles et officialisations de transferts.'),
    ('44444444-4444-4444-4444-444444444444', 'Culture Maillots & Équipements', 'culture-maillots-equipements', 'Nouveaux maillots, designs vintage, sneakers et lifestyle footballistique.'),
    ('55555555-5555-5555-5555-555555555555', 'Interviews & Reportages', 'interviews-reportages', 'Portraits de joueurs, analyses tactiques et coulisses des clubs.')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

INSERT INTO public.sports_articles (
    id, category_id, title, slug, excerpt, content, cover_image_url, status, is_featured, views_count, published_at, seo_title, seo_description
) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Lions de la Téranga : Victoire magistrale et qualification validée avec panache',
    'lions-de-la-teranga-victoire-qualification-can',
    'Au terme d’une rencontre maîtrisée de bout en bout au Stade Abdoulaye Wade, l’équipe nationale du Sénégal a assuré sa qualification pour la prochaine Coupe d’Afrique des Nations.',
    '<h2>Une démonstration collective devant un public en fusion</h2><p>Le Stade Abdoulaye Wade de Diamniadio a vibré au rythme d’une prestation de très haute volée. Dès les premières minutes de jeu, les Lions ont imposé un pressing tout terrain qui a complètement asphyxié l’adversaire.</p>',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=650&fit=crop',
    'PUBLISHED',
    TRUE,
    1420,
    CURRENT_TIMESTAMP,
    'Lions du Sénégal : Qualification CAN validée | JogaLook Actu',
    'Revivez la grande victoire des Lions de la Téranga assurant leur qualification avec panache.'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Ligue des Champions : Les chocs explosifs des quarts de finale dévoilés',
    'ligue-des-champions-chocs-explosifs-quarts-de-finale',
    'Le tirage au sort a rendu son verdict à Nyon : les géants d’Europe vont s’affronter dans des duels qui s’annoncent historiques pour conquérir la prestigieuse coupe aux grandes oreilles.',
    '<h2>Des retrouvailles au sommet du football européen</h2><p>Le tirage au sort des quarts de finale de l’UEFA Champions League a tenu toutes ses promesses en offrant des affiches dignes des plus grandes finales.</p>',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    890,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Quarts de finale Ligue des Champions : Tirage et Analyses | JogaLook',
    'Découvrez les affiches complètes des quarts de finale de Ligue des Champions.'
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '44444444-4444-4444-4444-444444444444',
    'Culture Maillots : Pourquoi le vintage des années 90 domine la mode urbaine',
    'culture-maillots-retro-vintage-domine-streetwear',
    'Du rectangle vert aux podiums de mode et à la culture streetwear, décryptage d’un phénomène générationnel où le maillot de football devient l’étendard du style.',
    '<h2>Quand le football redéfinit la haute couture et le streetwear</h2><p>Depuis plusieurs saisons, le maillot de football a quitté l’enceinte exclusive des stades pour conquérir le vestiaire quotidien.</p>',
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    1150,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'La tendance des maillots de football vintage dans le streetwear | JogaLook',
    'Pourquoi les maillots de foot vintage sont devenus incontournables dans la mode urbaine.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured;

-- ------------------------------------------------------------------------------
-- 10. SUIVI DU TRAFIC & DES VISITES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits(path);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON public.site_visits(user_id);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

