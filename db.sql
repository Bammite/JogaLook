-- ==============================================================================
-- SCHÉMA DE BASE DE DONNÉES POSTGRESQL - JOGALOOK
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS (Types énumérés)
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'SHOP_OWNER', 'DELIVERER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');
CREATE TYPE template_visibility AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
CREATE TYPE delivery_status AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- Paiement confirmé mais encaissé à la réception de la commande.
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'ON_DELIVERY';
CREATE TYPE otp_purpose AS ENUM ('REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'ORDER_CONFIRMATION');
CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED');

-- ------------------------------------------------------------------------------
-- 2. UTILISATEURS, ADRESSES & AUTENTIFICATION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    deleted_at TIMESTAMP WITH TIME ZONE -- Corbeille (Soft Delete)
);

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '[]'::jsonb,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
-- 3. BOUTIQUES, FOURNISSEURS & PRODUITS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
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

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    is_affiliated BOOLEAN DEFAULT FALSE, -- Fournisseur externe ou affilié
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
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

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
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

-- ------------------------------------------------------------------------------
-- 4. TEMPLATES & PERSONNALISATIONS (SVG)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = Appartient au site
    name VARCHAR(150) NOT NULL,
    description TEXT,
    svg_content TEXT NOT NULL, -- Rétrocompatibilité / Face principale
    svg_front TEXT,            -- Code SVG Face avant
    svg_back TEXT,             -- Code SVG Dos / Arrière
    badge_url TEXT,            -- Image ou URL du blason/logo par défaut
    badge_svg TEXT,            -- Code SVG vectoriel du blason
    thumbnail_url TEXT,
    editable_elements JSONB DEFAULT '{"body": true, "collar": true, "sleeves": true, "stripes": true, "badge": true, "name_zone": true, "number_zone": true}'::jsonb, -- Parties personnalisables
    layers_config JSONB DEFAULT '{"body_id": "jersey-body", "collar_id": "jersey-collar", "sleeves_id": "jersey-sleeves", "stripes_id": "jersey-stripes", "badge_zone_id": "badge-zone", "name_zone_id": "name-zone", "number_zone_id": "number-zone"}'::jsonb, -- Identifiants des calques SVG
    visibility template_visibility NOT NULL DEFAULT 'PUBLIC',
    is_free BOOLEAN DEFAULT TRUE,
    price DECIMAL(12, 2) DEFAULT 0.00,
    usage_count INT NOT NULL DEFAULT 0, -- Nombre d'utilisations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Propriété de l'utilisateur
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    title VARCHAR(150),
    svg_content TEXT NOT NULL,
    preview_image_url TEXT,
    custom_name VARCHAR(100),
    custom_number VARCHAR(10),
    font_family VARCHAR(100),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    extra_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 5. PANIER & COMMANDES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    customization_id UUID REFERENCES customizations(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
    shipping_address_id UUID REFERENCES addresses(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'PENDING',
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    customization_id UUID REFERENCES customizations(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    variant_info VARCHAR(100),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255) UNIQUE,
    amount DECIMAL(12, 2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    deliverer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100) UNIQUE,
    status delivery_status NOT NULL DEFAULT 'PENDING',
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivered_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. LOGS, OTP & RÉSERVATIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    purpose otp_purpose NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email_attempted VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    previous_status order_status,
    new_status order_status NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    status reservation_status NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. ACTUALITÉ SPORTIVE DE LA PLATEFORME
-- ------------------------------------------------------------------------------

CREATE TYPE sports_article_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Les catégories et les tags sont gérés par la plateforme.
CREATE TABLE IF NOT EXISTS sports_news_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sports_news_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- author_id référence admins : un article ne peut donc être publié que par
-- un compte éditorial interne à la plateforme.
CREATE TABLE IF NOT EXISTS sports_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES sports_news_categories(id) ON DELETE SET NULL,
    title VARCHAR(220) NOT NULL,
    slug VARCHAR(240) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL CHECK (length(btrim(content)) > 0),
    cover_image_url TEXT,
    status sports_article_status NOT NULL DEFAULT 'DRAFT',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    seo_title VARCHAR(220),
    seo_description VARCHAR(320),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT sports_articles_published_date_check CHECK (
        status <> 'PUBLISHED' OR published_at IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS sports_article_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES sports_articles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sports_article_tags (
    article_id UUID NOT NULL REFERENCES sports_articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES sports_news_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, tag_id)
);

-- Permet de relier un article interne aux produits présentés dans son contenu.
CREATE TABLE IF NOT EXISTS sports_article_products (
    article_id UUID NOT NULL REFERENCES sports_articles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, product_id)
);

-- ------------------------------------------------------------------------------
-- 8. INDEX DE PERFORMANCE
-- ------------------------------------------------------------------------------
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_templates_owner ON templates(owner_id);
CREATE INDEX idx_customizations_user ON customizations(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_otps_recipient ON otps(recipient);
CREATE INDEX idx_login_logs_user ON login_logs(user_id);
CREATE INDEX idx_order_logs_order ON order_logs(order_id);
CREATE INDEX idx_sports_articles_status_date
    ON sports_articles(status, published_at DESC);
CREATE INDEX idx_sports_articles_category
    ON sports_articles(category_id);
CREATE INDEX idx_sports_articles_author
    ON sports_articles(author_id);
CREATE INDEX idx_sports_article_images_article
    ON sports_article_images(article_id, position ASC);
CREATE INDEX idx_sports_article_tags_tag
    ON sports_article_tags(tag_id);
CREATE INDEX idx_sports_article_products_product
    ON sports_article_products(product_id);

CREATE UNIQUE INDEX idx_sports_article_images_primary_unique
    ON sports_article_images(article_id)
    WHERE is_primary = TRUE;

COMMENT ON COLUMN sports_articles.content IS
    'Contenu HTML de l''article, produit et publié exclusivement par la plateforme.';

-- ------------------------------------------------------------------------------
-- 10. GROUPES DE CATÉGORIES (NAVIGATION E-COMMERCE)
-- ------------------------------------------------------------------------------

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

ALTER TABLE category_groups
  ADD COLUMN IF NOT EXISTS show_in_navbar BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS category_group_items (
    group_id UUID NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    position INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_category_groups_display_order ON category_groups (display_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_category_group_items_group_id ON category_group_items (group_id);
CREATE INDEX IF NOT EXISTS idx_category_group_items_category_id ON category_group_items (category_id);
