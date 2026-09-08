import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  FootballIcon,
  FlameIcon,
  StarIcon,
  NewspaperIcon,
  AlertTriangleIcon,
} from '../components/icons/AppIcons';
import './NewsPage.css';

function formatDate(val) {
  if (!val) return '';
  return new Date(val).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const [artRes, catRes] = await Promise.all([
          fetch('/api/sports-news?status=PUBLISHED'),
          fetch('/api/sports-news/categories'),
        ]);

        const artJson = await artRes.json();
        const catJson = await catRes.json();

        if (artJson.success && Array.isArray(artJson.data)) {
          setArticles(artJson.data);
        } else {
          setArticles([]);
        }

        if (catJson.success && Array.isArray(catJson.data)) {
          setCategories(catJson.data);
        }
      } catch (err) {
        console.error('Erreur chargement actualités:', err);
        setError('Impossible de récupérer les actualités depuis le serveur.');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  // Filtrage dynamique
  const filtered = articles.filter((a) => {
    const categoryName = a.sports_news_categories?.name || 'Sport';
    const matchCat =
      selectedCategory === 'ALL' ||
      a.category_id === selectedCategory ||
      a.sports_news_categories?.slug === selectedCategory;
    const matchSearch =
      `${a.title} ${a.excerpt || ''} ${categoryName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Article à la Une (soit is_featured, soit le plus récent)
  const featuredArticle = filtered.find((a) => a.is_featured) || filtered[0];
  const otherArticles = featuredArticle
    ? filtered.filter((a) => a.id !== featuredArticle.id)
    : filtered;

  return (
    <>
      <Navbar />

      <main className="news-page">
        {/* ── Header ── */}
        <section className="news-hero-banner">
          <div className="container news-hero-content">
            <span className="news-badge">
              <FootballIcon size={16} /> JogaLook Actus
            </span>
            <h1 className="news-main-title">L’Actualité du Football & du Sport</h1>
            <p className="news-subtitle">
              Analyses, coulisses, mercato, culture maillots et résultats en direct.
            </p>

            {/* Barre de recherche */}
            <div className="news-search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher une actu, un club, un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="news-search-clear" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>
        </section>

        <div className="container news-container">
          {/* ── Catégories Filtres ── */}
          {categories.length > 0 && (
            <div className="news-categories-nav">
              <button
                className={`news-cat-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('ALL')}
              >
                <FlameIcon size={15} /> Tout voir
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`news-cat-btn ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="admin-loading" style={{ minHeight: '300px' }}>
              <div className="admin-spinner" style={{ width: 44, height: 44 }} />
              <p>Chargement des actualités en direct…</p>
            </div>
          ) : error ? (
            <div className="news-empty">
              <div className="news-empty-icon"><AlertTriangleIcon size={44} color="#EAB308" /></div>
              <h3>Erreur de connexion</h3>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* ── Article à la Une (Hero Featured) ── */}
              {featuredArticle && !searchQuery && selectedCategory === 'ALL' && (
                <Link to={`/actualites/${featuredArticle.slug || featuredArticle.id}`} className="news-featured-card">
                  <div className="news-featured-img-wrap">
                    {featuredArticle.cover_image_url ? (
                      <img src={featuredArticle.cover_image_url} alt={featuredArticle.title} />
                    ) : (
                      <div className="sports-table-cover-placeholder" style={{ height: '100%' }}>
                        <FootballIcon size={48} color="#CBD5E1" />
                      </div>
                    )}
                    <span className="news-card-tag news-card-tag--featured">
                      <StarIcon size={12} fill="currentColor" /> À LA UNE
                    </span>
                  </div>
                  <div className="news-featured-info">
                    <div className="news-card-meta">
                      <span className="news-card-category">
                        {featuredArticle.sports_news_categories?.name || 'Actualité'}
                      </span>
                      <span className="news-card-date">
                        {formatDate(featuredArticle.published_at || featuredArticle.created_at)}
                      </span>
                    </div>
                    <h2 className="news-featured-title">{featuredArticle.title}</h2>
                    <p className="news-featured-excerpt">{featuredArticle.excerpt}</p>
                    <span className="news-read-more">
                      Lire l'article complet
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </span>
                  </div>
                </Link>
              )}

              {/* ── Grille des articles ── */}
              <div className="news-grid-section">
                <h2 className="news-section-title">
                  {searchQuery ? `Résultats pour « ${searchQuery} »` : 'Dernières publications'}
                  <span className="news-count">({filtered.length})</span>
                </h2>

                {filtered.length === 0 ? (
                  <div className="news-empty">
                    <div className="news-empty-icon"><NewspaperIcon size={44} color="#94A3B8" /></div>
                    <h3>{articles.length === 0 ? 'Aucune actualité pour le moment' : 'Aucun résultat trouvé'}</h3>
                    <p>
                      {searchQuery || selectedCategory !== 'ALL'
                        ? 'Aucun article ne correspond à votre filtre.'
                        : 'Les actualités sportives apparaîtront ici dès leur publication.'}
                    </p>
                    {(searchQuery || selectedCategory !== 'ALL') && (
                      <button className="btn-primary" onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}>
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="news-grid">
                    {(searchQuery || selectedCategory !== 'ALL' ? filtered : otherArticles).map((article) => (
                      <Link
                        key={article.id}
                        to={`/actualites/${article.slug || article.id}`}
                        className="news-card"
                      >
                        <div className="news-card-img-wrap">
                          {article.cover_image_url ? (
                            <img src={article.cover_image_url} alt={article.title} />
                          ) : (
                            <div className="sports-table-cover-placeholder" style={{ height: '100%' }}>
                              <FootballIcon size={36} color="#CBD5E1" />
                            </div>
                          )}
                          <span className="news-card-tag">
                            {article.sports_news_categories?.name || 'Sport'}
                          </span>
                        </div>
                        <div className="news-card-body">
                          <span className="news-card-date">
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                          <h3 className="news-card-title">{article.title}</h3>
                          <p className="news-card-excerpt">{article.excerpt}</p>
                          <div className="news-card-footer">
                            <span className="news-card-link">
                              Lire l'article
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
