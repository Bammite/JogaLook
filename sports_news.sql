-- ==============================================================================
-- sports_news.sql — Module Actualités Sportives JogaLook
-- Exécuter dans Supabase : Dashboard -> SQL Editor -> Coller et exécuter (Run)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLE DES CATÉGORIES D'ACTUALITÉS SPORTIVES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sports_news_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(120) NOT NULL,
    slug        VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon_url    TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sports_news_categories_slug ON sports_news_categories(slug);

-- ------------------------------------------------------------------------------
-- 2. TABLE DES ARTICLES D'ACTUALITÉS SPORTIVES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sports_articles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id        UUID REFERENCES admins(id) ON DELETE SET NULL,
    category_id      UUID REFERENCES sports_news_categories(id) ON DELETE SET NULL,
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(255) UNIQUE NOT NULL,
    excerpt          TEXT,
    content          TEXT NOT NULL,
    cover_image_url  TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
    views_count      INT NOT NULL DEFAULT 0,
    published_at     TIMESTAMP WITH TIME ZONE,
    seo_title        VARCHAR(255),
    seo_description  TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sports_articles_slug ON sports_articles(slug);
CREATE INDEX IF NOT EXISTS idx_sports_articles_category ON sports_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_sports_articles_status ON sports_articles(status);
CREATE INDEX IF NOT EXISTS idx_sports_articles_published_at ON sports_articles(published_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TABLE DES TAGS & LIAISON ARTICLES / TAGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sports_news_tags (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(80) NOT NULL,
    slug       VARCHAR(80) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sports_article_tags (
    article_id UUID NOT NULL REFERENCES sports_articles(id) ON DELETE CASCADE,
    tag_id     UUID NOT NULL REFERENCES sports_news_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_sports_article_tags_tag ON sports_article_tags(tag_id);

-- ------------------------------------------------------------------------------
-- 4. INSERTION DES CATÉGORIES INITIALES (SEED DATA)
-- ------------------------------------------------------------------------------
INSERT INTO sports_news_categories (id, name, slug, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Football Sénégalais & CAN', 'football-senegalais-can', 'Actualités des Lions de la Téranga, Ligue 1 sénégalaise et compétitions africaines.'),
    ('22222222-2222-2222-2222-222222222222', 'Football International', 'football-international', 'UEFA Champions League, Premier League, Liga, Serie A et grandes compétitions mondiales.'),
    ('33333333-3333-3333-3333-333333333333', 'Mercato & Transferts', 'mercato-transferts', 'Toutes les rumeurs officielles et officialisations de transferts.'),
    ('44444444-4444-4444-4444-444444444444', 'Culture Maillots & Équipements', 'culture-maillots-equipements', 'Nouveaux maillots, designs vintage, sneakers et lifestyle footballistique.'),
    ('55555555-5555-5555-5555-555555555555', 'Interviews & Reportages', 'interviews-reportages', 'Portraits de joueurs, analyses tactiques et coulisses des clubs.')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 5. INSERTION DES VRAIS ARTICLES DE QUALITÉ (SEED DATA)
-- ------------------------------------------------------------------------------

-- Article 1 : Lions de la Téranga (À LA UNE)
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Lions de la Téranga : Victoire magistrale et qualification validée avec panache',
    'lions-de-la-teranga-victoire-qualification-can',
    'Au terme d’une rencontre maîtrisée de bout en bout au Stade Abdoulaye Wade, l’équipe nationale du Sénégal a assuré sa qualification pour la prochaine Coupe d’Afrique des Nations.',
    '<h2>Une démonstration collective devant un public en fusion</h2><p>Le Stade Abdoulaye Wade de Diamniadio a vibré au rythme d’une prestation de très haute volée. Dès les premières minutes de jeu, les Lions ont imposé un pressing tout terrain qui a complètement asphyxié l’adversaire. La fluidité technique au milieu de terrain et la percussion sur les ailes ont rapidement fait la différence.</p><blockquote>« Notre objectif était clair : imposer notre rythme dès le coup d’envoi et ne laisser aucun espace. Les joueurs ont respecté les consignes à la lettre avec un engagement total. » — Aliou Cissé</blockquote><h2>Des cadres au rendez-vous et une jeunesse brillante</h2><p>Sur le plan individuel, l’association entre l’expérience des cadres et l’insouciance de la nouvelle génération a fait des merveilles :</p><ul><li><strong>Solidité défensive :</strong> Zéro tir cadré concédé en première période avec une charnière impériale dans les duels aériens.</li><li><strong>Animation offensive :</strong> Des combinaisons rapides à une touche de balle et une efficacité redoutable sur phases arrêtées.</li><li><strong>Impact du banc :</strong> Les entrées en jeu ont apporté un second souffle décisif pour clore les débats avec autorité.</li></ul><h2>Cap sur la phase finale</h2><p>Avec cette victoire indiscutable, le Sénégal confirme son statut de grand favori et aborde les prochaines échéances internationales avec un plein de confiance.</p>',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=650&fit=crop',
    'PUBLISHED',
    TRUE,
    1420,
    CURRENT_TIMESTAMP,
    'Lions du Sénégal : Qualification CAN validée | JogaLook Actu',
    'Revivez la grande victoire des Lions de la Téranga assurant leur qualification avec panache.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured;

-- Article 2 : Ligue des Champions
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Ligue des Champions : Les chocs explosifs des quarts de finale dévoilés',
    'ligue-des-champions-chocs-explosifs-quarts-de-finale',
    'Le tirage au sort a rendu son verdict à Nyon : les géants d’Europe vont s’affronter dans des duels qui s’annoncent historiques pour conquérir la prestigieuse coupe aux grandes oreilles.',
    '<h2>Des retrouvailles au sommet du football européen</h2><p>Le tirage au sort des quarts de finale de l’UEFA Champions League a tenu toutes ses promesses en offrant des affiches dignes des plus grandes finales. L’intensité tactique et le niveau d’exigence promettent des soirées inoubliables pour tous les passionnés de football.</p><h2>Les points chauds à surveiller</h2><ul><li><strong>Bataille tactique des techniciens :</strong> Deux philosophies de jeu résolument offensives qui vont se confronter sur 180 minutes.</li><li><strong>Duels de buteurs :</strong> Les meilleurs attaquants de la planète face aux défenses les plus hermétiques du continent.</li><li><strong>L’ambiance des grands soirs :</strong> Les ambiances survoltées des stades mythiques qui joueront un rôle de douzième homme capital.</li></ul><p>Les rencontres aller se tiendront dès le mois prochain et tiendront sans aucun doute la planète football en haleine.</p>',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    890,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Quarts de finale Ligue des Champions : Tirage et Analyses | JogaLook',
    'Découvrez les affiches complètes des quarts de finale de Ligue des Champions et les analyses tactiques.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url;

-- Article 3 : Culture Maillots
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '44444444-4444-4444-4444-444444444444',
    'Culture Maillots : Pourquoi le vintage des années 90 domine la mode urbaine',
    'culture-maillots-retro-vintage-domine-streetwear',
    'Du rectangle vert aux podiums de mode et à la culture streetwear, décryptage d’un phénomène générationnel où le maillot de football devient l’étendard du style.',
    '<h2>Quand le football redéfinit la haute couture et le streetwear</h2><p>Depuis plusieurs saisons, le maillot de football a quitté l’enceinte exclusive des stades pour conquérir le vestiaire quotidien. Des collaborations prestigieuses entre équipementiers et maisons de mode jusqu’à l’engouement frénétique pour les tuniques rétro des années 90, la passion du ballon rond s’exprime désormais à travers le textile.</p><h2>Les éléments clés de cette tendance</h2><ul><li><strong>L’esthétique des sponsors iconiques :</strong> Les typographies et logos emblématiques des décennies passées qui évoquent une époque dorée.</li><li><strong>La personnalisation créative :</strong> Le flocage sur-mesure (noms, numéros rétro, badges exclusifs) qui transforme chaque maillot en pièce unique.</li><li><strong>Des matières innovantes :</strong> Des tissus techniques respirants alliés à des coupes élégantes adaptées au lifestyle urbain.</li></ul><blockquote>« Porter un maillot aujourd’hui, c’est revendiquer une identité, un attachement culturel et un sens pointu du style. »</blockquote><p>Chez JogaLook, nous célébrons cette culture en proposant des maillots authentiques et des outils de personnalisation poussés pour permettre à chacun d’exprimer sa singularité.</p>',
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
    cover_image_url = EXCLUDED.cover_image_url;

-- Article 4 : Mercato & Transferts
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '33333333-3333-3333-3333-333333333333',
    'Mercato Express : Les signatures et transferts surprises de la semaine',
    'mercato-express-signatures-transferts-surprises-semaine',
    'Tour d’horizon complet des officialisations majeures sur le marché des transferts en Europe, avec plusieurs mouvements stratégiques pour les talents africains.',
    '<h2>Un marché des transferts en pleine ébullition</h2><p>À l’approche des phases décisives des championnats, plusieurs écuries de premier plan ont accéléré sur leurs dossiers prioritaires. Entre clauses libératoires activées et prolongations de contrats stratégiques, la semaine a été particulièrement animée dans les états-majors des grands clubs.</p><h2>Les dossiers marquants</h2><ul><li><strong>Pépites africaines ciblées :</strong> Plusieurs jeunes talents formés sur le continent attirent l’attention des recruteurs de Premier League et de Bundesliga.</li><li><strong>Mouvements de cadres :</strong> Des départs inattendus qui rebattent les cartes dans la hiérarchie des grands championnats.</li><li><strong>Prêts avec option d’achat :</strong> Une formule de plus en plus plébiscitée pour sécuriser les effectifs sans compromettre le fair-play financier.</li></ul><p>Restez connectés sur JogaLook pour suivre en temps réel toutes les officialisations du mercato mondial.</p>',
    'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    760,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    'Mercato Football : Dernières officialisations et rumeurs | JogaLook',
    'Toutes les dernières informations officielles sur les transferts du football européen et africain.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url;

-- Article 5 : Lamine Camara & Nicolas Jackson
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'Lamine Camara et Nicolas Jackson : L’envolée spectaculaire de la relève sénégalaise',
    'lamine-camara-nicolas-jackson-releve-senegalaise-europe',
    'De Dakar à la Premier League et la Ligue 1, gros plan sur la progression fulgurante des deux pépites qui incarnent le futur radieux du football sénégalais.',
    '<h2>Une ascension fulgurante au plus haut niveau</h2><p>Le football sénégalais continue d’alimenter l’élite européenne avec des profils d’une rare complétude. Entre l’abattage athlétique et la vision de jeu de Lamine Camara dans l’entrejeu, et l’explosivité dévastatrice de Nicolas Jackson aux avant-postes, la transition générationnelle s’opère avec un brio éclatant.</p><h2>Des statistiques qui confirment le talent</h2><p>Les chiffres enregistrés cette saison témoignent de leur adaptation expresse :</p><ul><li><strong>Impact direct :</strong> Un ratio décisif (buts + passes) parmi les plus élevés pour les joueurs de leur tranche d’âge dans leurs championnats respectifs.</li><li><strong>Précision sous pression :</strong> Plus de 85% de passes réussies dans le dernier tiers adverse lors des grands rendez-vous.</li><li><strong>Discipline tactique :</strong> Une capacité de replacement saluée unanimement par leurs entraîneurs respectifs.</li></ul><p>Leur réussite confirme l’excellence du travail de formation au Sénégal et augure de superbes perspectives pour les Lions dans les années à venir.</p>',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    1340,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    'Lamine Camara et Nicolas Jackson : Les pépites sénégalaises | JogaLook',
    'Analyse de la progression des jeunes internationaux sénégalais qui brillent dans les plus grands clubs européens.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url;

-- Article 6 : Guide Entretien Maillots
INSERT INTO sports_articles (
    id,
    category_id,
    title,
    slug,
    excerpt,
    content,
    cover_image_url,
    status,
    is_featured,
    views_count,
    published_at,
    seo_title,
    seo_description
) VALUES (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '44444444-4444-4444-4444-444444444444',
    'Guide d’expert : Comment laver et entretenir vos maillots floqués pour les garder comme neufs',
    'guide-entretien-lavage-maillots-floques-conseils-experts',
    'Flocages thermosoudés, écussons brodés, tissus techniques : découvrez les règles d’or indispensables pour préserver l’éclat de vos maillots préférés.',
    '<h2>Préserver vos tuniques préférées au fil des saisons</h2><p>Acheter un maillot officiel floqué avec le nom de son joueur favori ou son propre flocage personnalisé représente un véritable investissement de cœur. Pourtant, une mauvaise habitude de lavage peut rapidement détériorer les flocages thermocollés ou altérer la respirabilité du tissu.</p><h2>Les 5 règles d’or du lavage</h2><ol><li><strong>Toujours laver sur l’envers :</strong> Cela protège les écussons, les logos des sponsors et les flocages des frottements répétés avec le tambour de la machine.</li><li><strong>Eau froide ou 30°C maximum :</strong> La chaleur excessive fait fondre la colle thermofusible des lettrages.</li><li><strong>Proscrire l’adoucissant :</strong> L’assouplissant obstrue les micro-pores respirants du tissu technique et accélère le décollement des badges.</li><li><strong>Jamais de sèche-linge :</strong> Le séchage à l’air libre sur cintre à l’ombre est obligatoire pour conserver la forme et l’élasticité de la tunique.</li><li><strong>Repassage interdit sur les flocages :</strong> Si un repassage est nécessaire, placez toujours un linge propre en coton entre le fer à basse température et le tissu, jamais directement sur le flocage.</li></ol><p>En appliquant ces conseils simples, vos maillots JogaLook conserveront leur éclat d’origine pour de très longues années.</p>',
    'https://images.unsplash.com/photo-1580087256394-dc596e5e8c3f?w=1200&h=650&fit=crop',
    'PUBLISHED',
    FALSE,
    980,
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    'Comment bien laver et entretenir ses maillots floqués | JogaLook Conseils',
    'Guide complet pour nettoyer ses maillots de football sans abîmer les flocages et écussons.'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url;

-- ------------------------------------------------------------------------------
-- 6. RLS (Row Level Security) — Supabase
-- ------------------------------------------------------------------------------
ALTER TABLE sports_news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_article_tags ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "sports_categories_select_public" ON sports_news_categories FOR SELECT USING (TRUE);
CREATE POLICY "sports_articles_select_public" ON sports_articles FOR SELECT USING (TRUE);
CREATE POLICY "sports_tags_select_public" ON sports_news_tags FOR SELECT USING (TRUE);
CREATE POLICY "sports_article_tags_select_public" ON sports_article_tags FOR SELECT USING (TRUE);

-- Écriture backend (service_role)
CREATE POLICY "sports_categories_write_service" ON sports_news_categories FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_articles_write_service" ON sports_articles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_tags_write_service" ON sports_news_tags FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "sports_article_tags_write_service" ON sports_article_tags FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
